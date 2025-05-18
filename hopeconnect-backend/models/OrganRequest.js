const mongoose = require('mongoose');

const organRequestSchema = new mongoose.Schema({
    requestingHospitalId: { // User ID of the hospital_staff making the request
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    // Or, if you have a separate Hospital model:
    // requestingHospitalEntityId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Hospital',
    //     required: true,
    // },
    patientIdInternal: {
        type: String,
        required: true,
    },
    patientNameAnonymized: String, // e.g., "Patient P.K."
    patientAge: {
        type: Number,
        required: true,
    },
    patientBloodType: {
        type: String,
        required: true,
    },
    patientHlaType: String,
    requiredOrganType: {
        type: String,
        required: true,
        enum: ['Kidney', 'Liver', 'Heart', 'Lung', 'Pancreas', 'Intestine', 'Cornea', 'Tissue'],
    },
    criticalityScore: { // Score indicating urgency (e.g., MELD, PELD, LAS)
        type: Number,
        min: 1,
        required: true,
    },
    waitingSince: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending_match', 'match_found_awaits_confirmation', 'transplant_scheduled', 'transplant_in_progress', 'transplant_completed', 'closed_unsuccessful', 'closed_other_reason'],
        default: 'pending_match',
    },
    aiMatchingFactorsConsidered: [String],
    // potentialMatchesAI: [{ // If you want to store AI's initial list for review
    //     donorDid: String,
    //     matchScore: Number,
    //     estimatedViability: Number,
    // }],
    confirmedMatch: {
        donorDbId: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor' },
        donorDid: String,
        organId_Blockchain: String, // The specific unique ID for this organ instance in the transplant log
        transplantLogId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'TransplantLog'
        }
    },
    notes: String,
}, {
    timestamps: true
});

organRequestSchema.index({ status: 1, requiredOrganType: 1, criticalityScore: -1 });

const OrganRequest = mongoose.model('OrganRequest', organRequestSchema);

module.exports = OrganRequest;