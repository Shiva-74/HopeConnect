const mongoose = require('mongoose');

const statusUpdateSchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
        // Examples: 'MatchConfirmed_AwaitingRecovery', 'OrganRecoveryScheduled', 'OrganRecovered',
        // 'TransportInitiated', 'InTransit_Ground', 'InTransit_Air', 'ArrivedAtRecipientHospital',
        // 'PreTransplantChecks', 'TransplantSurgeryStarted', 'TransplantSurgeryCompleted', 'PostOpMonitoring'
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    actorId: { // User ID (staff) or entity ID (e.g., Hospital ID)
        type: mongoose.Schema.Types.ObjectId,
        // ref: 'User' // Or 'Hospital'
    },
    actorRole: String, // e.g., 'MatchingHospitalStaff', 'RecoverySurgeon', 'LogisticsCoordinator', 'RecipientSurgeon'
    notes: String,
    blockchainTxHash: String,
    location: { // Optional: for geospatial tracking updates
        type: { type: String, enum: ['Point'], required: false },
        coordinates: { type: [Number], required: false } // [longitude, latitude]
    }
}, { _id: true });
statusUpdateSchema.index({ 'location.coordinates': '2dsphere' }); // Geospatial index if using location frequently

const transplantLogSchema = new mongoose.Schema({
    organChainId: { // A unique identifier for this specific organ journey, used on blockchain
        type: String,
        required: true,
        unique: true,
    },
    organRequestId: { // Link back to the original OrganRequest
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OrganRequest',
        required: true,
    },
    donorDid: {
        type: String,
        required: true,
        index: true,
    },
    donorUserId: { // Link to the User model of the donor
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    recipientDidAnonymized: { // Anonymized DID or identifier for the recipient in the log
        type: String,
        index: true,
    },
    recipientPatientId_Internal: String,
    organType: {
        type: String,
        required: true,
    },
    recoveryHospitalInfo: { // Info about the hospital where organ was recovered
        name: String,
        did: String, // Hospital's DID
        // staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    recipientHospitalInfo: { // Info about the hospital where transplant occurs
        name: String,
        did: String,
        // staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    logisticsProviderInfo: {
        name: String,
        did: String, // Logistics provider's DID
        // staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    transportId_Logistics: String,
    statusHistory: [statusUpdateSchema],
    currentStatus: {
        type: String,
        required: true,
    },
    aiMatchScoreAtSelection: Number,
    aiPredictedViabilityAtRecovery: Number,
    actualColdIschemiaTimeHours: Number,
    // Timestamps for key events can also be top-level fields for easier querying
    // consentTimestamp: Date,
    recoveryTimestamp: Date,
    transportInitiatedTimestamp: Date,
    deliveryTimestamp: Date,
    transplantScheduledTimestamp: Date,
    transplantCompletedTimestamp: Date,
    transplantOutcome: {
        type: String,
        enum: ['Pending', 'Successful', 'Failed_GraftRejection', 'Failed_SurgicalComplication', 'Failed_Other', 'Successful_WithComplications'],
        default: 'Pending',
    },
    thankYouMessageDetails: {
        sent: { type: Boolean, default: false },
        timestamp: Date,
        // messageId: String // If you have a messaging system
    },
    blockchainTxHashesAll: { // A place to store multiple blockchain transaction hashes related to this log
        // Example: 'organPledgeOrAllocation': String,
        'organRecoveryConfirmation': String,
        'transportUpdate_1': String, // Can be dynamic or an array
        'transplantCompletionConfirmation': String,
    }
}, {
    timestamps: true
});

transplantLogSchema.index({ donorDid: 1, currentStatus: 1 });
transplantLogSchema.index({ 'recipientDidAnonymized': 1, currentStatus: 1 });
transplantLogSchema.index({ currentStatus: 1, organType: 1 });

const TransplantLog = mongoose.model('TransplantLog', transplantLogSchema);

module.exports = TransplantLog;