// HopeConnect/hopeconnect-backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Ensure bcryptjs is in your package.json and installed

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        trim: true,
        // This is a more standard and robust regex for common email formats
        match: [
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
            'Please provide a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false, // Do not send back password by default
    },
    role: {
        type: String,
        enum: {
            values: ['donor', 'hospital_staff', 'admin', 'logistics_provider'],
            message: '{VALUE} is not a supported role'
        },
        default: 'donor',
        required: true,
    },
    ethAddress: {
        type: String,
        trim: true,
        // Optional: If you want to validate ETH address format:
        // match: [/^0x[a-fA-F0-9]{40}$/, 'Please provide a valid Ethereum address']
    },
    donorProfileId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donor',
        default: null,
    },
    hospitalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        default: null,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
}, {
    timestamps: true // Adds createdAt and updatedAt timestamps
});

// Optional: Password Hashing Middleware (Uncomment if you want Mongoose to handle hashing)
// If you use this, remove manual hashing in authController.js before User.create()
/*
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error); // Pass error to the next middleware/error handler
    }
});
*/

const User = mongoose.model('User', userSchema);

module.exports = User;