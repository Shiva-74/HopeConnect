const express = require('express');
const router = express.Router();
const donorController = require('../controllers/donorController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Routes specific to users with 'donor' role, operating on their own profile
router.post(
    '/register-profile',
    protect,
    authorize('donor'), // Ensure only users with 'donor' role can access
    donorController.registerDonorProfile
);
router.post(
    '/consent', // Operates on the logged-in donor's profile
    protect,
    authorize('donor'),
    donorController.submitOrUpdateConsent
);
router.get(
    '/dashboard',
    protect,
    authorize('donor'),
    donorController.getDonorDashboard
);
router.put(
    '/profile-update', // Donors update their own specific donor details
    protect,
    authorize('donor'),
    donorController.updateDonorProfileDetails
);

router.get(
    '/list-for-hospital',
    protect,
    authorize('hospital_staff', 'admin'), // Or a more specific role if needed
    donorController.listDonorsForHospital
);


// Example of a more public or admin-accessible route for donor info (if needed)
// router.get('/:donorId', donorController.getPublicDonorInfo); // (Controller function needs to be created)

module.exports = router;