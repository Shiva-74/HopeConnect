const User = require('../models/User');
const Donor = require('../models/Donor'); // Needed if linking donor profile on login/profile
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { name, email, password, role, ethAddress } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide name, email, and password' });
    }

    try {
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role || 'donor', // Default to donor if not specified
            ethAddress // Can be null initially
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                ethAddress: user.ethAddress,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data during creation' });
        }
    } catch (error) {
        console.error("Register User Error:", error);
        if (error.code === 11000) { // Duplicate key error (e.g. for email)
             return res.status(400).json({ message: 'Email already registered.' });
        }
        res.status(500).json({ message: 'Server error during registration', details: error.message });
    }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    try {
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password'); // Explicitly select password

        if (user && (await bcrypt.compare(password, user.password))) {
            // If user is a donor, try to populate donorProfileId details slightly
            let donorProfileInfo = null;
            if (user.role === 'donor' && user.donorProfileId) {
                const donorProfile = await Donor.findById(user.donorProfileId).select('did healthCheckStatus');
                if (donorProfile) {
                    donorProfileInfo = {
                        _id: donorProfile._id,
                        did: donorProfile.did,
                        healthCheckStatus: donorProfile.healthCheckStatus
                    };
                }
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                ethAddress: user.ethAddress,
                donorProfile: donorProfileInfo, // Send basic donor profile info if applicable
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error("Login User Error:", error);
        res.status(500).json({ message: 'Server error during login', details: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getUserProfile = async (req, res) => {
    // req.user is set by the protect middleware
    if (req.user) {
        // If user is a donor, try to populate donorProfileId details
        let donorProfileInfo = null;
        if (req.user.role === 'donor' && req.user.donorProfileId) {
            const donorProfile = await Donor.findById(req.user.donorProfileId).select('did healthCheckStatus pledgedOrgans');
            if (donorProfile) {
                donorProfileInfo = {
                    _id: donorProfile._id,
                    did: donorProfile.did,
                    healthCheckStatus: donorProfile.healthCheckStatus,
                    pledgedOrgansCount: donorProfile.pledgedOrgans ? donorProfile.pledgedOrgans.length : 0
                };
            }
        }
        res.json({
            _id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            ethAddress: req.user.ethAddress,
            donorProfile: donorProfileInfo,
            createdAt: req.user.createdAt
        });
    } else {
        // This case should ideally be caught by 'protect' middleware if no user found for token
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile (e.g., name, ethAddress)
// @route   PUT /api/auth/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email; // Be cautious allowing email change due to uniqueness
            user.ethAddress = req.body.ethAddress || user.ethAddress;

            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            const updatedUser = await user.save();
             // If user is a donor, try to populate donorProfileId details
            let donorProfileInfo = null;
            if (updatedUser.role === 'donor' && updatedUser.donorProfileId) {
                const donorProfile = await Donor.findById(updatedUser.donorProfileId).select('did healthCheckStatus');
                if (donorProfile) {
                    donorProfileInfo = {
                        _id: donorProfile._id,
                        did: donorProfile.did,
                        healthCheckStatus: donorProfile.healthCheckStatus
                    };
                }
            }

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                ethAddress: updatedUser.ethAddress,
                donorProfile: donorProfileInfo,
                token: generateToken(updatedUser._id), // Re-issue token if sensitive info changed? Optional.
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error("Update User Profile Error:", error);
        if (error.code === 11000) { // Duplicate key error (e.g. for email)
             return res.status(400).json({ message: 'Email already in use by another account.' });
        }
        res.status(500).json({ message: 'Server error updating profile', details: error.message });
    }
};