const Donor = require('../models/Donor');
const User = require('../models/User');
const TransplantLog = require('../models/TransplantLog'); // For donor activity
const { generateDID } = require('../utils/didHelper');
const blockchainService = require('../services/blockchainService');

// @desc    Register current logged-in user as a donor (create donor profile)
// @route   POST /api/donors/register-profile
// @access  Private (User must have 'donor' role)

exports.listDonorsForHospital = async (req, res) => {
    const { searchTerm } = req.query;
    try {
        let query = {};
        // Only search confirmed/relevant donors for hospitals
        query.healthCheckStatus = { $in: ['fit_for_donation', 'pending_health_check', 'health_check_scheduled', 'health_check_completed'] };
        query.consentGiven = true;


        if (searchTerm) {
            const regex = new RegExp(searchTerm, 'i'); // Case-insensitive search
            query.$or = [
                { fullName: regex },
                { did: regex },
            ];
            // If searching by ETH address, you might need to query User first or adjust if ETH address is directly on Donor
            const usersByEth = await User.find({ ethAddress: regex }).select('_id');
            if (usersByEth.length > 0) {
                query.$or.push({ userId: { $in: usersByEth.map(u => u._id) } });
            }
        }
        
        const donors = await Donor.find(query)
            .select('did fullName userId healthCheckStatus consentGiven dateOfBirth bloodType') // Added dob, bloodType
            .populate('userId', 'ethAddress')
            .limit(50)
            .sort({ createdAt: -1 });

        const responseDonors = donors.map(d => ({
            _id: d._id,
            did: d.did,
            fullName: d.fullName,
            ethAddress: d.userId ? d.userId.ethAddress : 'N/A',
            consent: d.consentGiven ? 'Given' : 'Pending/No',
            health: d.healthCheckStatus?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown',
            dob: d.dateOfBirth,
            bloodType: d.bloodType
        }));

        res.json(responseDonors);
    } catch (error) {
        console.error("List Donors for Hospital error:", error);
        res.status(500).json({ message: 'Server error fetching donor list.', details: error.message });
    }
};

exports.registerDonorProfile = async (req, res) => {
    const userId = req.user.id; // From protect middleware
    const {
        fullName, dob, bloodType, contactInfo, // Basic info
        consentGiven, consentFormUrl, // Consent related
        specificOrgansToPledge, // Array of objects like [{ organType: 'Kidney' }, { organType: 'Cornea' }]
        ethAddressForProfile, // Optional: donor can specify ETH address here if not on User profile
        isDeceasedDonor, // Medical info
    } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            console.error("registerDonorProfile: User not found for ID:", userId);
            return res.status(404).json({ message: "User not found. Please log in." });
        }
        if (user.role !== 'donor') {
            console.error("registerDonorProfile: User role is not 'donor'. User:", user.email, "Role:", user.role);
            return res.status(403).json({ message: "User role is not 'donor'." });
        }
        if (user.donorProfileId) {
            console.error("registerDonorProfile: Donor profile already exists for user:", user.email);
            return res.status(400).json({ message: "A donor profile already exists for this user." });
        }

        const effectiveEthAddress = ethAddressForProfile || user.ethAddress;
        if (!effectiveEthAddress || effectiveEthAddress === '0x0000000000000000000000000000000000000000') {
            console.error("registerDonorProfile: Ethereum address is missing or zero address. Provided:", ethAddressForProfile, "User's ETH:", user.ethAddress);
            return res.status(400).json({ message: "Ethereum address is required for donor registration. Please update your user profile or provide one." });
        }

        const donorDid = generateDID('donor');
        if (!donorDid || donorDid.length === 0) {
            console.error("registerDonorProfile: Generated Donor DID is empty.");
            return res.status(500).json({ message: "Failed to generate a valid Donor DID." });
        }

        // --- DEBUG INFO ---
        console.log("--- DEBUG INFO for blockchainService.registerDonorOnChain ---");
        console.log("Donor DID being sent:", donorDid);
        console.log("Donor ETH Address being sent:", effectiveEthAddress);
        console.log("Is donorDID empty?", donorDid.length === 0);
        console.log("Is effectiveEthAddress zero?", effectiveEthAddress === '0x0000000000000000000000000000000000000000' || !effectiveEthAddress);
        console.log("----------------------------------------------------------");
        // --- END OF DEBUG INFO ---

        // 1. Register on Blockchain
        const registrationTxHash = await blockchainService.registerDonorOnChain(donorDid, effectiveEthAddress);

        // 2. Prepare pledged organs array
        const pledgedOrgans = specificOrgansToPledge && Array.isArray(specificOrgansToPledge)
            ? specificOrgansToPledge.map(org => ({ organType: org.organType, isPledged: true, status: 'pledged' }))
            : [];

        // 3. Create Donor Profile in DB
        const newDonor = new Donor({
            userId,
            did: donorDid,
            fullName: fullName || user.name,
            dateOfBirth: dob,
            bloodType,
            contactInfo,
            consentGiven: !!consentGiven,
            consentFormUrl: consentFormUrl || null,
            pledgedOrgans,
            isDeceasedDonor: !!isDeceasedDonor,
            healthCheckStatus: 'pending_registration_confirmation',
            blockchainTxHashes: { registration: registrationTxHash }
        });
        await newDonor.save();

        user.donorProfileId = newDonor._id;
        if (ethAddressForProfile && (!user.ethAddress || user.ethAddress === '0x0000000000000000000000000000000000000000')) {
            user.ethAddress = effectiveEthAddress;
        }
        await user.save();

        // Optional: Award initial tokens
        // const initialTokenAward = 5;
        // await blockchainService.awardHopeTokens(effectiveEthAddress, initialTokenAward);

        console.log("Donor profile successfully created in DB for user:", user.email, "DID:", donorDid);
        res.status(201).json({
            message: 'Donor profile registration successful. Awaiting blockchain confirmation and consent submission.',
            donor: newDonor,
            txHash: registrationTxHash
        });
    } catch (error) {
        console.error("Donor profile registration error (controller catch block):", error.message);
        // More detailed logging for blockchain specific errors
        if (error.code === 310 || (error.cause && error.cause.code === -32000) || (error.message && error.message.toLowerCase().includes("revert"))) {
            console.error("BLOCKCHAIN REVERT DETAILS (from controller catch):", error.cause ? JSON.stringify(error.cause) : "No additional cause info in error object.");
            console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
        }
        res.status(500).json({ message: 'Server error during donor profile registration.', details: error.message });
    }
};

// @desc    Submit/Update consent form details for a donor
// @route   POST /api/donors/consent
// @access  Private (Donor role only)
exports.submitOrUpdateConsent = async (req, res) => {
    const userId = req.user.id;
    const { consentFormUrl, consentDetailsHash, consentGivenStatus } = req.body;

    try {
        const donor = await Donor.findOne({ userId }).populate('userId', 'ethAddress');
        if (!donor) {
            console.error("submitOrUpdateConsent: Donor profile not found for user ID:", userId);
            return res.status(404).json({ message: "Donor profile not found for this user." });
        }

        if (!!consentGivenStatus && !consentDetailsHash) { // Ensure consentGivenStatus is boolean for check
            console.warn("submitOrUpdateConsent: Consent details hash missing while consentGivenStatus is true for donor DID:", donor.did);
            return res.status(400).json({ message: "Consent details hash is required if giving consent." });
        }

        let consentTxHash = donor.blockchainTxHashes?.consentRecording || null;
        // Placeholder for blockchainService.recordConsentOnChain as it's currently skipped in blockchainService.js
        // If you implement recordConsentOnChain, uncomment the following block:
        /*
        if (!!consentGivenStatus && consentDetailsHash) {
            if (donor.consentDetailsHash_Blockchain !== consentDetailsHash || !donor.consentGiven) {
                 console.log("Attempting to record consent on blockchain for DID:", donor.did);
                 consentTxHash = await blockchainService.recordConsentOnChain(donor.did, consentDetailsHash);
                 console.log("Blockchain consent recording TxHash:", consentTxHash);
            }
        }
        */
       // For now, we rely on the skip message from blockchainService.js if that function is called
       if (!!consentGivenStatus && consentDetailsHash) {
           const tempTxHash = await blockchainService.recordConsentOnChain(donor.did, consentDetailsHash);
           if (tempTxHash !== "SKIPPED_CONSENT_BC_NO_FUNCTION") {
               consentTxHash = tempTxHash;
           }
       }


        donor.consentGiven = !!consentGivenStatus;
        donor.consentFormUrl = consentFormUrl || donor.consentFormUrl; // Keep old if new is not provided
        donor.consentDetailsHash_Blockchain = consentDetailsHash || donor.consentDetailsHash_Blockchain; // Keep old if new is not provided

        if (!donor.blockchainTxHashes) donor.blockchainTxHashes = {};
        if (consentTxHash && consentTxHash !== "SKIPPED_CONSENT_BC_NO_FUNCTION") {
            donor.blockchainTxHashes.consentRecording = consentTxHash;
        }

        if (donor.consentGiven && donor.healthCheckStatus === 'pending_registration_confirmation') {
            donor.healthCheckStatus = 'pending_health_check';
        }
        // Add logic if consent is revoked, e.g., donor.healthCheckStatus = 'consent_revoked';

        await donor.save();
        console.log("Consent status updated for donor DID:", donor.did, "to:", donor.consentGiven);
        res.json({
            message: `Consent status ${donor.consentGiven ? 'submitted/updated' : 'revoked/updated'}.`,
            donor,
            txHash: consentTxHash
        });

    } catch (error) {
        console.error("Submit/Update consent error:", error.message);
        res.status(500).json({ message: 'Server error processing consent.', details: error.message });
    }
};


// @desc    Get donor's dashboard information (profile, token balance, activity)
// @route   GET /api/donors/dashboard
// @access  Private (Donor role)
exports.getDonorDashboard = async (req, res) => {
    const userId = req.user.id;
    try {
        const donorProfile = await Donor.findOne({ userId }).populate('userId', 'name email ethAddress');
        if (!donorProfile) {
            console.warn("getDonorDashboard: Donor profile not found for user ID:", userId);
            return res.status(404).json({ message: "Donor profile not found. Please complete your donor registration." });
        }

        let tokenBalance = '0';
        if (donorProfile.userId && donorProfile.userId.ethAddress) {
            try {
                tokenBalance = await blockchainService.getTokenBalance(donorProfile.userId.ethAddress);
            } catch (tokenError) {
                console.warn("getDonorDashboard: Could not fetch token balance for donor:", donorProfile.did, "Error:", tokenError.message);
                // Don't fail the whole request, just show 0 balance or an error message for balance
            }
        }

        const donorActivity = await TransplantLog.find({ donorDid: donorProfile.did })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('organType currentStatus transplantOutcome createdAt recipientHospitalInfo.name');

        res.json({
            profile: donorProfile,
            hopeTokenBalance: tokenBalance,
            activity: donorActivity,
        });
    } catch (error) {
        console.error("Get Donor Dashboard error:", error.message);
        res.status(500).json({ message: 'Server error fetching donor dashboard.', details: error.message });
    }
};


// @desc    Update donor's medical information or pledged organs by the donor themselves
// @route   PUT /api/donors/profile-update
// @access  Private (Donor role)
exports.updateDonorProfileDetails = async (req, res) => {
    const userId = req.user.id;
    const {
        fullName, dob, bloodType, contactInfo,
        specificOrgansToPledge, // Array of objects like [{ organType: 'Kidney' }]
        comorbidities, hlaType
    } = req.body;

    try {
        const donor = await Donor.findOne({ userId });
        if (!donor) {
            console.warn("updateDonorProfileDetails: Donor profile not found for user ID:", userId);
            return res.status(404).json({ message: "Donor profile not found." });
        }

        // Update fields if they are provided in the request
        if (fullName !== undefined) donor.fullName = fullName;
        if (dob !== undefined) donor.dateOfBirth = dob;
        if (bloodType !== undefined) donor.bloodType = bloodType;
        if (contactInfo !== undefined) donor.contactInfo = contactInfo; // Could be an object, handle partial updates if needed
        if (comorbidities !== undefined && Array.isArray(comorbidities)) donor.comorbidities = comorbidities;
        if (hlaType !== undefined) donor.hlaType = hlaType;

        if (specificOrgansToPledge && Array.isArray(specificOrgansToPledge)) {
            // This replaces the entire array. If you need to add/remove individual organs,
            // the logic would be more complex (e.g., find existing, update, add new).
            donor.pledgedOrgans = specificOrgansToPledge.map(org => ({
                organType: org.organType,
                isPledged: true, // Assume newly specified organs are actively pledged
                status: 'pledged'
            }));
        }

        const updatedDonor = await donor.save();
        console.log("Donor profile details updated for DID:", updatedDonor.did);
        res.json({ message: "Donor profile updated successfully.", donor: updatedDonor });

    } catch (error) {
        console.error("Update Donor Profile Details error:", error.message);
        res.status(500).json({ message: 'Server error updating donor profile.', details: error.message });
    }
};