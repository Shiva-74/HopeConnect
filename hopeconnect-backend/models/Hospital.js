const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    did: { // DID for the hospital entity
        type: String,
        required: true,
        unique: true,
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
    },
    contact: {
        phone: String,
        email: {
            type: String,
            lowercase: true,
            // match: [VALID_EMAIL_REGEX]
        },
    },
    type: { // Type of hospital
        type: String,
        enum: ['General', 'TransplantCenter', 'OrganRecoveryCenter', 'PartnerClinic'],
    },
    accreditations: [String],
    location: { // Geolocation for distance calculations
        type: { type: String, enum: ['Point'], default: 'Point', required: false },
        coordinates: { type: [Number], required: false } // [longitude, latitude]
    },
    // adminUserIds: [{ // Users with admin rights for this hospital portal
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User'
    // }],
    blockchainAddress: String, // If the hospital entity has its own address on the blockchain for signing/representing
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true
});
hospitalSchema.index({ 'location.coordinates': '2dsphere' });

const Hospital = mongoose.model('Hospital', hospitalSchema);

module.exports = Hospital;