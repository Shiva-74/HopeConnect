const TransplantLog = require('../models/TransplantLog');
const blockchainService = require('../services/blockchainService'); // To potentially fetch on-chain events

// @desc    Get detailed audit trail for a specific organ donation journey
// @route   GET /api/tracking/:trackingId (trackingId is TransplantLog Mongoose _id)
// @access  Public (or Private, depending on data sensitivity requirements)
exports.getAuditTrail = async (req, res) => {
    const { trackingId } = req.params;
    try {
        const log = await TransplantLog.findById(trackingId)
            .populate('organRequestId', 'patientNameAnonymized requiredOrganType criticalityScore') // Populate some request details
            .populate('donorUserId', 'name') // Populate some donor user details (careful with PII)
            .populate('statusHistory.actorId', 'name role'); // Populate actor names in status history

        if (!log) {
            return res.status(404).json({ message: "Tracking ID not found. Invalid organ journey." });
        }

        // Optionally, fetch and merge blockchain events if they provide more detail than DB statusHistory
        // This can be slow if there are many events or the chain is congested.
        let blockchainEvents = [];
        // try {
        //     blockchainEvents = await blockchainService.getPastEvents(
        //         'OrganStatusUpdated', // Assuming this is your event name in OrganChain.sol
        //         { organId: log.organChainId }, // Filter by the unique organ journey ID
        //         0 // Start from genesis block (or a more recent one for efficiency)
        //     );
        // } catch (bcError) {
        //     console.warn("Could not fetch blockchain events for audit trail:", bcError.message);
        // }

        // For now, just send the DB log. Merging would require careful handling of timestamps and data.
        res.json({
            message: "Audit trail retrieved.",
            auditTrail: log,
            // blockchainEvents: blockchainEvents // Optionally include raw blockchain events
        });
    } catch (error) {
        console.error("Get Audit Trail error:", error);
        res.status(500).json({ message: 'Server error fetching audit trail.', details: error.message });
    }
};

// @desc    Logistics provider (or authorized hospital staff) updates transport status of an organ
// @route   POST /api/tracking/:transplantLogId/update-status
// @access  Private (logistics_provider, hospital_staff, admin)
exports.updateTransportAndOtherStatus = async (req, res) => {
    const { transplantLogId } = req.params;
    const {
        newStatus, // e.g., 'TransportInitiated', 'InTransit_Air', 'ArrivedAtRecipientHospital'
        notes,
        location, // Optional: { type: 'Point', coordinates: [longitude, latitude] }
        estimatedDeliveryTime, // Optional
        actualDeliveryTime, // Optional
    } = req.body;
    const actorUserId = req.user.id; // User ID of the person making the update
    const actorUserRole = req.user.role;

    try {
        const log = await TransplantLog.findById(transplantLogId);
        if (!log) return res.status(404).json({ message: "Transplant log (Tracking ID) not found." });

        // TODO: Add more robust status transition validation
        // e.g., cannot go from 'OrganRecovered' directly to 'TransplantCompletedSuccessfully'

        // Map newStatus string to numeric value for blockchain if applicable for this status update
        let statusNumericForBlockchain;
        let needsBlockchainUpdate = false; // Flag to decide if this status warrants a chain update

        if (newStatus === 'TransportInitiated') {
            statusNumericForBlockchain = 2; // Example: Corresponds to 'InTransit' or similar in contract
            needsBlockchainUpdate = true;
            log.transportInitiatedTimestamp = new Date();
        } else if (newStatus === 'ArrivedAtRecipientHospital') {
            statusNumericForBlockchain = 3; // Example: Corresponds to 'Delivered' in contract
            needsBlockchainUpdate = true;
            log.deliveryTimestamp = actualDeliveryTime ? new Date(actualDeliveryTime) : new Date();
        }
        // Add more status mappings as needed for your workflow and contract

        let blockchainTransactionHash = null;
        if (needsBlockchainUpdate && statusNumericForBlockchain !== undefined) {
            const actorEthAddress = req.user.ethAddress; // ETH address of the updater (logistics or hospital staff)
            if (!actorEthAddress) {
                 console.warn(`User ${actorUserId} updating status ${newStatus} does not have an ETH address. Blockchain update skipped.`);
            } else {
                try {
                    blockchainTransactionHash = await blockchainService.updateOrganStatusOnChain(
                        log.organChainId,
                        statusNumericForBlockchain,
                        actorEthAddress
                    );
                } catch (bcError) {
                    console.error(`Blockchain status update failed for ${log.organChainId} to ${newStatus}:`, bcError.message);
                    // Decide if this should fail the whole request or just log the warning
                }
            }
        }

        const statusUpdateEntry = {
            status: newStatus,
            timestamp: new Date(),
            actorId: actorUserId,
            actorRole: actorUserRole,
            notes: notes,
            blockchainTxHash: blockchainTransactionHash,
        };
        if (location && location.coordinates && location.coordinates.length === 2) {
            statusUpdateEntry.location = location;
        }

        log.statusHistory.push(statusUpdateEntry);
        log.currentStatus = newStatus;

        // Update specific timestamps if provided
        if (newStatus === 'TransportInitiated' && estimatedDeliveryTime) {
            // log.estimatedDeliveryTimestamp = new Date(estimatedDeliveryTime); // Add to model if needed
        }

        if (!log.blockchainTxHashesAll) log.blockchainTxHashesAll = {};
        if (blockchainTransactionHash) {
            // Store dynamically or have specific fields
            log.blockchainTxHashesAll[`statusUpdate_${newStatus.replace(/\s+/g, '_')}`] = blockchainTransactionHash;
        }


        await log.save();
        res.json({ message: `Organ journey status updated to '${newStatus}'.`, log });

    } catch (error) {
        console.error("Update Transport/Other Status error:", error);
        res.status(500).json({ message: 'Server error updating organ journey status.', details: error.message });
    }
};