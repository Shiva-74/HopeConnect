const mongoose = require('mongoose');

const organPledgeSchema = new mongoose.Schema({
    organType: {
        type: String,
        required: true,
        enum: ['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas', 'Intestine', 'Cornea', 'Tissue'],
    },
    isPledged: { // Is this specific organ currently actively pledged by the donor?
        type: Boolean,
        default: true,
    },
    status: { // Status of this specific pledged organ for the donor
        type: String,
        enum: ['pledged', 'awaits_matching', 'matched', 'allocated_for_recovery', 'recovered', 'unavailable'],
        default: 'pledged'
    },
    // organId_Blockchain: { // Optional: If each individual organ gets a unique ID on blockchain *before* actual recovery
    //     type: String,
    //     sparse: true,
    //     unique: true,
    // }
}, { _id: true }); // _id: true allows each pledged organ to have its own unique ID within the array if needed, or false.

const donorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    did: {
        type: String,
        required: true,
        unique: true,
    },
    fullName: {
        type: String,
        required: true,
    },
    dateOfBirth: {
        type: Date,
        required: true,
    },
    bloodType: {
        type: String,
        required: true,
        // enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    contactInfo: {
        phone: String,
        address: String,
    },
    consentGiven: {
        type: Boolean,
        default: false,
    },
    consentFormUrl: String,
    consentDetailsHash_Blockchain: String,
    healthCheckStatus: {
        type: String,
        enum: ['pending_registration_confirmation', 'pending_health_check', 'health_check_scheduled', 'health_check_completed', 'fit_for_donation', 'unfit_for_donation', 'temporarily_unfit'],
        default: 'pending_registration_confirmation',
    },
    healthScore_AI: {
        type: Number,
        min: 0,
        max: 100,
    },
    lastHealthCheckDate: Date,
    pledgedOrgans: [organPledgeSchema],
    comorbidities: [String], // e.g., ['Hypertension', 'Diabetes Type 2']
    hlaType: String, // Simplified HLA typing, e.g., "A1,A2,B5,B8,DR1,DR2"
    blockchainTxHashes: {
        registration: String,
        consentRecording: String,
        healthUpdate: String,
    },
    isDeceasedDonor: {
        type: Boolean,
        default: false,
    },
    // Fields for deceased donor if applicable
    // causeOfDeath: String,
    // timeOfDeath: Date,
    // brainDeathCertified: Boolean,
    // nextOfKinContact: String,
}, {
    timestamps: true
});

const Donor = mongoose.model('Donor', donorSchema);

module.exports = Donor;