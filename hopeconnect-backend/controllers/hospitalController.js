const Donor = require('../models/Donor');
const OrganRequest = require('../models/OrganRequest');
const TransplantLog = require('../models/TransplantLog');
const User = require('../models/User');
const aiService = require('../services/aiService');
const blockchainService = require('../services/blockchainService');
const { generateDID } = require('../utils/didHelper');
const { ORGAN_TYPES_ENUM_ORDER } = require('../utils/constants');

// Helper function for blood type compatibility (Simplified - adapt as needed)
const isBloodTypeCompatible = (donorBlood, recipientBlood) => {
    if (!donorBlood || !recipientBlood) return false;
    const d = donorBlood.toUpperCase();
    const r = recipientBlood.toUpperCase();

    // O- can donate to anyone
    if (d === "O-") return true;
    // O+ can donate to any positive Rh factor
    if (d === "O+") return (r.includes("+") || r === "AB-"); // AB- can take O+ in emergencies, but generally Rh match

    // A- can donate to A-, A+, AB-, AB+
    if (d === "A-") return (r === "A-" || r === "A+" || r === "AB-" || r === "AB+");
    // A+ can donate to A+, AB+
    if (d === "A+") return (r === "A+" || r === "AB+");

    // B- can donate to B-, B+, AB-, AB+
    if (d === "B-") return (r === "B-" || r === "B+" || r === "AB-" || r === "AB+");
    // B+ can donate to B+, AB+
    if (d === "B+") return (r === "B+" || r === "AB+");

    // AB- can donate to AB-, AB+
    if (d === "AB-") return (r === "AB-" || r === "AB+");
    // AB+ can donate to AB+
    if (d === "AB+") return (r === "AB+");

    return false; // Default to not compatible
};

// Calculate age (helper function, can be moved to utils)
const calculateAge = (dob) => {
    if (!dob) return 0; // Or handle as an error/unknown
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age > 0 ? age : 0; // Ensure age is not negative
};


// @desc    Hospital staff updates a specific donor's health details after a checkup
// @route   PUT /api/hospital/donor-health/:donorDbId
// @access  Private (hospital_staff, admin)


exports.registerOrganForDonor = async (req, res) => {
    const { donorDid, organType, recoveryNotes } = req.body; // recoveryHospitalDid comes from logged-in user or system config
    
    // Assuming the hospital DID performing the recovery is associated with the logged-in staff user
    // Or it could be a system-wide configured DID if the backend admin acts for all hospitals.
    // For this example, let's assume we need to fetch it or have it available for the logged-in hospital.
    // This part might need adjustment based on how your hospital entities are managed.
    // If User model has a hospitalDID field for hospital_staff:
    const staffUser = await User.findById(req.user.id);
    const recoveryHospitalDid = staffUser.hospitalDid || process.env.DEFAULT_RECOVERY_HOSPITAL_DID; // Fallback to a default

    if (!donorDid || !organType || !recoveryHospitalDid) {
        return res.status(400).json({ message: "Donor DID, Organ Type, and Recovery Hospital DID are required." });
    }

    try {
        const donorProfile = await Donor.findOne({ did: donorDid });
        if (!donorProfile) {
            return res.status(404).json({ message: `Donor with DID ${donorDid} not found.` });
        }
        // You might add more checks here, e.g., if donor is consented for this organ type in your DB,
        // but the OrganChain.registerOrgan already has a consent check via IConsentManager.

        const organTypeString = organType; // Assuming organType from frontend is a string like "Liver"

        // Call blockchain service to register the organ
        // The blockchainService.registerOrganByHospitalOnChain will handle mapping string to numeric for the contract
        const { transactionHash, organIdBlockchain } = await blockchainService.registerOrganByHospitalOnChain(
            donorDid,
            organTypeString,
            recoveryHospitalDid
        );

        if (!organIdBlockchain) {
            console.error(`Failed to get organIdBlockchain from OrganChain event for Tx: ${transactionHash}`);
            // This might happen if the event wasn't emitted or parsed correctly.
            // Decide if this is a critical failure or if you proceed with DB logging only.
            // For now, we'll assume it's critical for linking.
             return res.status(500).json({ message: "Organ registered on blockchain, but failed to retrieve its on-chain ID. Please check transaction." });
        }

        // Update donor's pledged organ status in DB (find the first matching pledged organ and update it)
        const pledgedOrganToUpdate = donorProfile.pledgedOrgans.find(
            pOrg => pOrg.organType === organTypeString && pOrg.status === 'pledged'
        );

        if (pledgedOrganToUpdate) {
            pledgedOrganToUpdate.status = 'registered_on_chain'; // Or 'recovered_on_chain'
            // You might want to store the organIdBlockchain with the specific pledgedOrgan subdocument
            // For example, if organPledgeSchema has a 'blockchainInstanceId' field:
            // pledgedOrganToUpdate.blockchainInstanceId = organIdBlockchain;
            await donorProfile.save();
            console.log(`Updated status for pledged ${organTypeString} of donor ${donorDid} to 'registered_on_chain'.`);
        } else {
            console.warn(`No specific 'pledged' ${organTypeString} found for donor ${donorDid} to update status. Organ was still registered on chain.`);
            // You could create a new entry in pledgedOrgans if appropriate for your logic:
            // donorProfile.pledgedOrgans.push({ organType: organTypeString, isPledged: false, status: 'registered_on_chain', blockchainInstanceId: organIdBlockchain });
            // await donorProfile.save();
        }

        // Optionally, create a new TransplantLog entry here with status 'OrganRecovered' or 'RegisteredOnChain'
        // if your flow requires it immediately after organ registration by hospital.
        // For now, TransplantLog is created later via initiateOrganTransfer/match confirmation.
        // However, the `organChainId` used in TransplantLog should be this `organIdBlockchain`.

        res.status(201).json({
            message: `Organ (${organTypeString}) for donor ${donorDid} successfully registered on OrganChain.`,
            organIdBlockchain: organIdBlockchain, // This is the uint256 from the contract event
            transactionHash: transactionHash,
            donorProfileId: donorProfile._id
        });

    } catch (error) {
        console.error("Hospital Register Organ for Donor error:", error);
        if (error.message.includes("Donor profile not registered on OrganChain")) {
            return res.status(400).json({ message: "Donor's base profile (DID & ETH Address) must be registered on OrganChain first." });
        }
        if (error.message.includes("Caller not hospital DID owner")) {
            return res.status(403).json({ message: "Action unauthorized: Caller is not the owner of the recovery hospital DID specified or does not have HOSPITAL_ROLE." });
        }
        if (error.message.includes("Consent not found")) {
            return res.status(400).json({ message: "Consent for this organ type or donation is not permitted for this donor on-chain." });
        }
        res.status(500).json({ message: 'Server error registering organ.', details: error.message });
    }
};


exports.updateDonorHealthByHospital = async (req, res) => {
    console.log("<<<<< DEBUG: Inside hospitalController.updateDonorHealthByHospital >>>>");
    const { donorDbId } = req.params;
    const {
        healthCheckPassed, healthScoreAIGiven, labResultsSummary, // Assuming labResultsSummary is a simple object/string for now
        comorbidities, hlaType, notes,
    } = req.body;

    try {
        const donor = await Donor.findById(donorDbId).populate('userId', 'ethAddress name');
        if (!donor) {
            console.warn("updateDonorHealthByHospital: Donor profile not found for ID:", donorDbId);
            return res.status(404).json({ message: "Donor profile not found with this ID." });
        }

        console.log("Updating health for Donor DID:", donor.did, "by User:", req.user.email);

        if (healthScoreAIGiven !== undefined) {
            donor.healthScore_AI = parseFloat(healthScoreAIGiven);
        }
        donor.healthCheckStatus = healthCheckPassed ? 'fit_for_donation' : 'unfit_for_donation';
        donor.lastHealthCheckDate = new Date();
        if (comorbidities && Array.isArray(comorbidities)) donor.comorbidities = comorbidities;
        if (hlaType) donor.hlaType = hlaType;
        // if (labResultsSummary) donor.labResultsSummary = labResultsSummary; // Add to Donor schema if needed
        if (notes) donor.notes_health = notes; // Ensure 'notes_health' field exists in Donor model schema

        let healthUpdateTxHash = donor.blockchainTxHashes?.healthUpdate || null;
        if (donor.healthScore_AI !== undefined && donor.healthScore_AI !== null) {
            const tempTxHash = await blockchainService.updateDonorHealthOnChain(donor.did, Math.round(donor.healthScore_AI));
            if (tempTxHash && tempTxHash !== "SKIPPED_HEALTH_BC_NO_FUNCTION") { // Check against skip placeholder
                healthUpdateTxHash = tempTxHash;
            }
        }

        if (!donor.blockchainTxHashes) donor.blockchainTxHashes = {};
        if (healthUpdateTxHash && healthUpdateTxHash !== "SKIPPED_HEALTH_BC_NO_FUNCTION") {
            donor.blockchainTxHashes.healthUpdate = healthUpdateTxHash;
        }
        await donor.save();

        if (healthCheckPassed && donor.userId && donor.userId.ethAddress) {
            const tokenAmountForHealthCheck = 25; // Example amount
            try {
                await blockchainService.awardHopeTokens(donor.userId.ethAddress, tokenAmountForHealthCheck);
                console.log(`Awarded ${tokenAmountForHealthCheck} tokens to ${donor.userId.ethAddress} for health check.`);
            } catch (tokenError) {
                console.error("Token award failed for health check (Donor DID:", donor.did, "):", tokenError.message);
            }
        }
        console.log("Donor health updated successfully by hospital for DID:", donor.did);
        res.json({ message: "Donor health details updated successfully by hospital.", donor });
    } catch (error) {
        console.error("Hospital Update Donor Health error:", error.message);
        res.status(500).json({ message: 'Server error updating donor health details.', details: error.message });
    }
};

// @desc    Hospital submits a new request for an organ for a patient
// @route   POST /api/hospital/request-organ
// @access  Private (hospital_staff, admin)
exports.requestOrgan = async (req, res) => {
    console.log("<<<<< DEBUG: Inside hospitalController.requestOrgan >>>>");
    console.log("Request Body for new organ request:", req.body);
    console.log("Authenticated User (Hospital Staff):", req.user ? req.user.email : "No user (Auth issue?)");

    const {
        patientIdInternal, patientNameAnonymized, patientAge,
        patientBloodType, patientHlaType, requiredOrganType, criticalityScore, notes
    } = req.body;

    if (!patientIdInternal || patientAge === undefined || !patientBloodType || !requiredOrganType || criticalityScore === undefined) {
        console.warn("requestOrgan: Validation failed - Missing required fields.");
        return res.status(400).json({ message: "Missing required fields for organ request. Required: patientIdInternal, patientAge, patientBloodType, requiredOrganType, criticalityScore." });
    }
    if (typeof Number(patientAge) !== 'number' || Number(patientAge) < 0) { // Age can be 0 for newborns
        return res.status(400).json({ message: "Invalid patient age." });
    }
    if (typeof Number(criticalityScore) !== 'number' || Number(criticalityScore) < 1) {
        return res.status(400).json({ message: "Invalid criticality score." });
    }

    try {
        if (!req.user || !req.user.id) {
            console.error("requestOrgan: No authenticated user found (req.user is missing). Ensure 'protect' and 'hospitalAccess' middleware are active and token is valid.");
            return res.status(401).json({ message: "Not authorized: User information missing." });
        }

        const newRequest = await OrganRequest.create({
            requestingHospitalId: req.user.id,
            patientIdInternal,
            patientNameAnonymized,
            patientAge: Number(patientAge),
            patientBloodType,
            patientHlaType: patientHlaType || null,
            requiredOrganType,
            criticalityScore: Number(criticalityScore),
            notes: notes || null,
            status: 'pending_match',
            waitingSince: new Date()
        });
        console.log("requestOrgan: New organ request successfully created in DB with ID:", newRequest._id);
        res.status(201).json({
            message: "Organ request submitted successfully.",
            request: newRequest
        });
    } catch (error) {
        console.error("Hospital Request Organ - Controller Catch Block Error:", error.message);
        if (error.name === 'ValidationError') {
            let validationMessages = {};
            for (let field in error.errors) {
                validationMessages[field] = error.errors[field].message;
            }
            return res.status(400).json({ message: "Validation failed creating organ request.", errors: validationMessages });
        }
        res.status(500).json({ message: 'Server error submitting organ request.', details: error.message });
    }
};

// @desc    Hospital finds potential matches for a specific organ request ID
// @route   GET /api/hospital/find-matches/:organRequestId
// @access  Private (hospital_staff, admin)
exports.findMatchesForRequest = async (req, res) => {
    console.log("<<<<< DEBUG: Inside hospitalController.findMatchesForRequest >>>>");
    const { organRequestId } = req.params;

    try {
        const organRequest = await OrganRequest.findById(organRequestId);
        if (!organRequest) {
            console.warn("findMatchesForRequest: Organ request not found for ID:", organRequestId);
            return res.status(404).json({ message: "Organ request not found." });
        }
        console.log("Finding matches for Organ Request ID:", organRequestId, "Patient Type:", organRequest.patientBloodType, "Organ:", organRequest.requiredOrganType);

        const potentialDonors = await Donor.find({
            consentGiven: true,
            healthCheckStatus: 'fit_for_donation',
            'pledgedOrgans.organType': organRequest.requiredOrganType,
            'pledgedOrgans.isPledged': true
        }).populate('userId', 'ethAddress'); // For ETH address

        if (!potentialDonors.length) {
            console.log("No potential donors found based on consent, health, and organ pledge for type:", organRequest.requiredOrganType);
            return res.json({ message: "No potential donors found matching basic criteria.", requestDetails: organRequest, matches: [] });
        }

        const compatibleDonors = potentialDonors.filter(donor =>
            isBloodTypeCompatible(donor.bloodType, organRequest.patientBloodType)
        );

        if (!compatibleDonors.length) {
            console.log("No blood type compatible donors found. Patient:", organRequest.patientBloodType, "Donors checked:", potentialDonors.map(d => d.bloodType));
            return res.json({ message: "No blood type compatible donors found.", requestDetails: organRequest, matches: [] });
        }
        console.log("Found", compatibleDonors.length, "blood type compatible donors.");

        let allRankedMatchesFromAI = [];
        const patientHlaArray = organRequest.patientHlaType ? organRequest.patientHlaType.split(',') : [];
        const patientRecipientDataForAI = {
            recipient_id: organRequest._id.toString(),
            recipient_age: organRequest.patientAge,
            recipient_blood_type: organRequest.patientBloodType,
            recipient_hla_a1: patientHlaArray[0] || "N/A", recipient_hla_a2: patientHlaArray[1] || "N/A",
            recipient_hla_b1: patientHlaArray[2] || "N/A", recipient_hla_b2: patientHlaArray[3] || "N/A",
            recipient_location_lat: 0.0, recipient_location_lon: 0.0, // Placeholder - TODO: Get from hospital profile
            urgency_score: organRequest.criticalityScore,
            recipient_comorbidities: 0 // Placeholder - TODO: Get actual patient comorbidities
        };

        for (const donor of compatibleDonors) {
            const pledgedOrganDetails = donor.pledgedOrgans.find(
                pOrg => pOrg.organType === organRequest.requiredOrganType && pOrg.isPledged
            );
            if (!pledgedOrganDetails) continue;

            const donorAge = calculateAge(donor.dateOfBirth);
            const donorHlaArray = donor.hlaType ? donor.hlaType.split(',') : [];
            const organDataForAI = {
                organ_id_donor_db: donor._id.toString(), organ_type: organRequest.requiredOrganType,
                donor_age: donorAge, donor_blood_type: donor.bloodType,
                donor_hla_a1: donorHlaArray[0] || "N/A", donor_hla_a2: donorHlaArray[1] || "N/A",
                donor_hla_b1: donorHlaArray[2] || "N/A", donor_hla_b2: donorHlaArray[3] || "N/A",
                donor_location_lat: 0.0, donor_location_lon: 0.0, // Placeholder - TODO: Get from donor/hospital
                donor_comorbidities: donor.comorbidities ? donor.comorbidities.length : 0
            };

            const aiPayload = {
                organ: organDataForAI,
                recipients: [patientRecipientDataForAI],
                logistics: { [organRequest._id.toString()]: { "estimated_cold_ischemia_hours": 4 } } // Example CIT
            };

            try {
                console.log("Sending to AI for matching: Donor DID", donor.did, "vs Patient in Request ID", organRequest._id);
                const aiMatchResponse = await aiService.matchOrgans(aiPayload);
                if (aiMatchResponse && aiMatchResponse.length > 0) {
                    const matchResultForPatient = aiMatchResponse[0]; // AI returns array, we sent one recipient
                    allRankedMatchesFromAI.push({
                        donorDbId: donor._id.toString(), donorDid: donor.did,
                        donorFullName: donor.fullName, donorBloodType: donor.bloodType, donorAge,
                        matchScore: matchResultForPatient.score,
                        aiDetails: matchResultForPatient.details,
                        organPledgeId: pledgedOrganDetails._id.toString() // ID of the specific organ subdocument
                    });
                } else {
                     console.warn("AI service returned no matches or unexpected response for donor DID:", donor.did, "Response:", aiMatchResponse);
                }
            } catch (aiError) {
                console.error(`AI matching API call error for donor ${donor.did}:`, aiError.response ? aiError.response.data : aiError.message);
            }
        }
        allRankedMatchesFromAI.sort((a, b) => b.matchScore - a.matchScore);
        console.log("Total AI ranked matches found:", allRankedMatchesFromAI.length);
        res.json({ message: "Potential matches retrieved.", requestDetails: organRequest, matches: allRankedMatchesFromAI });

    } catch (error) {
        console.error("Hospital Find Matches error:", error.message);
        res.status(500).json({ message: 'Server error finding matches.', details: error.message });
    }
};

// @desc    Hospital selects a specific donor organ and initiates the transplant process
// @route   POST /api/hospital/initiate-transplant
// @access  Private (hospital_staff, admin)
exports.initiateOrganTransfer = async (req, res) => {
    console.log("<<<<< DEBUG: Inside hospitalController.initiateOrganTransfer >>>>");
    const {
        organRequestId, selectedDonorDbId, selectedOrganPledgeId,
        organType, aiMatchScoreAtSelection
    } = req.body;
    const hospitalStaffUserId = req.user.id;

    try {
        // Validate inputs
        if (!organRequestId || !selectedDonorDbId || !selectedOrganPledgeId || !organType) {
            return res.status(400).json({ message: "Missing required fields for initiating transfer." });
        }

        const organRequest = await OrganRequest.findById(organRequestId);
        const donor = await Donor.findById(selectedDonorDbId).populate('userId'); // For donor.userId.ethAddress
        const initiatingStaff = await User.findById(hospitalStaffUserId); // For actor logging

        if (!organRequest) return res.status(404).json({ message: "Organ request not found." });
        if (!donor) return res.status(404).json({ message: "Selected donor not found." });
        if (!initiatingStaff) return res.status(404).json({ message: "Initiating hospital staff user not found." }); // Should be caught by protect

        if (organRequest.status !== 'pending_match') {
             return res.status(400).json({ message: "This organ request is not currently pending a match." });
        }
        if (organRequest.requiredOrganType !== organType) {
            return res.status(400).json({ message: "Selected organ type does not match the request's required organ type." });
        }

        const pledgedOrgan = donor.pledgedOrgans.id(selectedOrganPledgeId); // Find subdocument by its _id
        if (!pledgedOrgan) return res.status(404).json({ message: "Specific organ pledge not found on donor's profile."});
        if (!pledgedOrgan.isPledged) return res.status(400).json({ message: "Selected organ is no longer pledged/available."});
        if (pledgedOrgan.organType !== organType) return res.status(400).json({ message: "Organ type of selected pledge does not match."});

        pledgedOrgan.isPledged = false;
        pledgedOrgan.status = 'allocated_for_recovery';

        const organChainId = generateDID('organ_journey') + `_${Date.now()}`; // Unique ID for this transplant journey
        const newTransplantLog = new TransplantLog({
            organChainId, organRequestId: organRequest._id,
            donorDid: donor.did, donorUserId: donor.userId._id,
            recipientDidAnonymized: `DID:HOPE:RECIPIENT:${organRequest.patientIdInternal}`, // Construct a recipient DID
            recipientPatientId_Internal: organRequest.patientIdInternal, organType,
            // TODO: Populate recoveryHospitalInfo and recipientHospitalInfo from actual hospital data
            recoveryHospitalInfo: { name: "HopeConnect Recovery Center", did: generateDID('hospital') }, // Placeholder
            recipientHospitalInfo: { name: "HopeConnect Transplant Institute", did: generateDID('hospital') }, // Placeholder
            currentStatus: 'MatchConfirmed_AwaitingRecovery',
            statusHistory: [{
                status: 'MatchConfirmed_AwaitingRecovery', actorId: hospitalStaffUserId,
                actorRole: initiatingStaff.role, timestamp: new Date(),
            }],
            aiMatchScoreAtSelection: parseFloat(aiMatchScoreAtSelection) || 0,
        });

        // Placeholder for blockchainService.pledgeOrganOnChain if you implement that step
        // For now, OrganChain.registerOrgan (by hospital) would be a more direct first step for the organ itself
        // or updateOrganStatusOnChain if an organ entity was already created.

        organRequest.status = 'match_found_awaits_confirmation'; // Or 'transplant_scheduled_pending_recovery'
        organRequest.confirmedMatch = {
            donorDbId: donor._id, donorDid: donor.did,
            organId_Blockchain: organChainId, // This refers to the TransplantLog's organChainId for this journey
            transplantLogId: newTransplantLog._id
        };

        await donor.save();
        await newTransplantLog.save();
        await organRequest.save();

        console.log("Organ transfer initiated. TransplantLog ID (Tracking ID):", newTransplantLog._id);
        res.status(200).json({
            message: "Organ transfer process initiated. Organ allocated for recovery.",
            trackingId: newTransplantLog._id,
            transplantLog: newTransplantLog
        });
    } catch (error) {
        console.error("Hospital Initiate Organ Transfer error:", error.message);
        res.status(500).json({ message: 'Server error initiating organ transfer.', details: error.message });
    }
};

// @desc    Hospital staff records that an organ has been successfully recovered
// @route   POST /api/hospital/record-recovery/:transplantLogId
// @access  Private (hospital_staff, admin)
exports.recordOrganRecovery = async (req, res) => {
    console.log("<<<<< DEBUG: Inside hospitalController.recordOrganRecovery >>>>");
    const { transplantLogId } = req.params;
    const { recoveryTimestamp, notes, recoveryTeamLeadDidOrId } = req.body;
    const staffUserId = req.user.id; // From 'protect' middleware

    try {
        const log = await TransplantLog.findById(transplantLogId).populate('donorUserId', 'ethAddress name'); // For donor name if needed
        if (!log) {
            console.warn("recordOrganRecovery: Transplant log not found for ID:", transplantLogId);
            return res.status(404).json({ message: "Transplant log not found." });
        }
        // Example valid previous statuses
        const validPreviousStatuses = ['MatchConfirmed_AwaitingRecovery', 'OrganRecoveryScheduled'];
        if (!validPreviousStatuses.includes(log.currentStatus)) {
            return res.status(400).json({ message: `Organ recovery cannot be recorded from current status: ${log.currentStatus}` });
        }

        const newStatus = 'OrganRecovered';
        const statusNumericForBlockchain = 1; // Example: Corresponds to OrganChain.OrganStatus.Recovered
        const actorEthAddress = req.user.ethAddress || blockchainService.getAdminAddress(); // ETH of staff or admin

        let recoveryTxHash = `SKIPPED_BC_RECOVERY_${Date.now()}`; // Default if blockchain call skipped/failed
        if (actorEthAddress) {
            try {
                // In blockchainService.updateOrganStatusOnChain, it expects (organIdBlockchain, newStatusNumeric, actorAddress, notes, newHolderDID)
                // We are passing log.organChainId, statusNumericForBlockchain, actorEthAddress, notes for this update.
                // The last param newHolderDID might be the recovery hospital's DID if status implies change of custody.
                // For 'OrganRecovered', the holder might still be the recovery hospital.
                const recoveryHospitalDID = log.recoveryHospitalInfo?.did || generateDID('hospital'); // Get from log or generate

                recoveryTxHash = await blockchainService.updateOrganStatusOnChain(
                    log.organChainId,
                    statusNumericForBlockchain,
                    notes || `Organ ${log.organType} recovered by ${req.user.name || 'hospital staff'}.`, // Notes
                    recoveryHospitalDID // New holder DID (could be same as current if it's recovery hospital)
                    // The 'actorAddress' for the sendTransaction is the backend admin.
                    // The 'actorAddress' *parameter* to updateOrganStatus (if your contract uses it differently) might be derived.
                    // The provided OrganChain.updateOrganStatusByDID does not take an explicit actorAddress param for the method call itself,
                    // it uses msg.sender to derive actorDID.
                );
            } catch (bcError) {
                console.error("Blockchain organ recovery status update failed:", bcError.message);
            }
        } else {
            console.warn("No ETH address for staff/admin to send organ recovery blockchain transaction.");
        }

        const statusUpdate = {
            status: newStatus,
            timestamp: recoveryTimestamp ? new Date(recoveryTimestamp) : new Date(),
            actorId: staffUserId, actorRole: req.user.role,
            notes: notes || `Organ ${log.organType} recovered. Lead: ${recoveryTeamLeadDidOrId || 'N/A'}.`,
            blockchainTxHash: recoveryTxHash,
        };

        log.statusHistory.push(statusUpdate);
        log.currentStatus = newStatus;
        log.recoveryTimestamp = statusUpdate.timestamp;
        if (!log.blockchainTxHashesAll) log.blockchainTxHashesAll = {};
        log.blockchainTxHashesAll.organRecoveryConfirmation = recoveryTxHash;

        await log.save();
        console.log("Organ recovery recorded for TransplantLog ID:", log._id);
        res.json({ message: "Organ recovery recorded successfully.", log });
    } catch (error) {
        console.error("Record Organ Recovery error:", error.message);
        res.status(500).json({ message: 'Server error recording organ recovery.', details: error.message });
    }
};

// @desc    Recipient hospital staff records transplant completion
// @route   POST /api/hospital/record-completion/:transplantLogId
// @access  Private (hospital_staff, admin)
exports.recordTransplantCompletion = async (req, res) => {
    console.log("<<<<< DEBUG: Inside hospitalController.recordTransplantCompletion >>>>");
    const { transplantLogId } = req.params;
    const { completionTimestamp, outcome, notes, surgeonDidOrId } = req.body; // outcome: 'Successful', 'Failed_GraftRejection', etc.
    const staffUserId = req.user.id;

    try {
        const log = await TransplantLog.findById(transplantLogId)
            .populate({ path: 'organRequestId', select: 'patientIdInternal' }) // For anonymized info
            .populate({ path: 'donorUserId', select: 'ethAddress name' }); // For token award & logging

        if (!log) {
            console.warn("recordTransplantCompletion: Transplant log not found for ID:", transplantLogId);
            return res.status(404).json({ message: "Transplant log not found." });
        }
        // Example valid previous statuses for recording completion
        const validPreviousStatusesCompletion = ['ArrivedAtRecipientHospital', 'TransplantSurgeryStarted', 'OrganRecovered', 'DeliveredToHospital']; // Add 'OrganRecovered' if transport is skipped/internal
        if (!validPreviousStatusesCompletion.includes(log.currentStatus)) {
           return res.status(400).json({ message: `Cannot record transplant completion from current status: ${log.currentStatus}` });
        }
        if (!outcome) {
            return res.status(400).json({ message: "Outcome (e.g., 'Successful', 'Failed_Other') is required." });
        }


        const newStatus = outcome === 'Successful' ? 'TransplantCompletedSuccessfully' : `Transplant${outcome.replace(/\s+/g, '_')}`;

        // For OrganChain.recordTransplantOutcome(organId, successful, anonymizedInfo, notes)
        const successfulBool = outcome === 'Successful';
        const anonymizedInfoForChain = `Patient ${log.organRequestId ? log.organRequestId.patientIdInternal : log.recipientDidAnonymized}, Organ ${log.organType}`;
        const notesForChain = notes || `Transplant outcome: ${outcome}. Surgeon: ${surgeonDidOrId || 'N/A'}.`;
        let completionTxHash = `SKIPPED_BC_COMPLETION_${Date.now()}`;

        // The transaction for recordTransplantOutcome must be sent by the recipient hospital's authorized ETH address
        // This assumes req.user.ethAddress is that hospital's representative.
        const actorEthAddress = req.user.ethAddress || blockchainService.getAdminAddress();
        if (actorEthAddress) {
            try {
                completionTxHash = await blockchainService.recordTransplantOutcomeOnChain(
                    log.organChainId, // This is the uint256 organId that OrganChain.sol expects
                    successfulBool,
                    anonymizedInfoForChain,
                    notesForChain
                );
            } catch (bcError) {
                console.error("Blockchain transplant completion recording failed:", bcError.message);
            }
        } else {
             console.warn("No ETH address for staff/admin to send transplant completion blockchain transaction.");
        }


        const statusUpdate = {
            status: newStatus,
            timestamp: completionTimestamp ? new Date(completionTimestamp) : new Date(),
            actorId: staffUserId, actorRole: req.user.role,
            notes: notesForChain,
            blockchainTxHash: completionTxHash,
        };

        log.statusHistory.push(statusUpdate);
        log.currentStatus = newStatus;
        log.transplantOutcome = outcome;
        log.transplantCompletedTimestamp = statusUpdate.timestamp;
        if (!log.blockchainTxHashesAll) log.blockchainTxHashesAll = {};
        log.blockchainTxHashesAll.transplantCompletionConfirmation = completionTxHash;

        if (outcome === 'Successful' && log.donorUserId && log.donorUserId.ethAddress) {
            const tokenAmountForSuccessfulDonation = 100; // Example
            try {
                await blockchainService.awardHopeTokens(log.donorUserId.ethAddress, tokenAmountForSuccessfulDonation);
                log.thankYouMessageDetails = { sent: true, timestamp: new Date() }; // Update model if this field exists
                console.log(`Awarded ${tokenAmountForSuccessfulDonation} tokens to donor ${log.donorUserId.name} (ETH: ${log.donorUserId.ethAddress})`);
            } catch (tokenError) {
                console.error("Token award failed for successful donation (Donor ETH:", log.donorUserId.ethAddress, "):", tokenError.message);
            }
        }

        if (log.organRequestId && log.organRequestId._id) { // Check if populated
            const originalRequest = await OrganRequest.findById(log.organRequestId._id);
            if (originalRequest) {
                originalRequest.status = outcome === 'Successful' ? 'transplant_completed' : 'closed_unsuccessful';
                await originalRequest.save();
            }
        }
        await log.save();
        console.log("Transplant completion recorded for TransplantLog ID:", log._id, "Outcome:", outcome);
        res.json({ message: `Transplant completion recorded as ${outcome}.`, log });
    } catch (error) {
        console.error("Record Transplant Completion error:", error.message);
        res.status(500).json({ message: 'Server error recording transplant completion.', details: error.message });
    }
};