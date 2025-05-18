const express = require('express');
const router = express.Router();

// Import the controller
const hospitalController = require('../controllers/hospitalController');

// Import middleware
const { protect, authorize } = require('../middleware/authMiddleware');

// Define a reusable middleware for routes that require hospital_staff or admin access
const hospitalAccess = authorize('hospital_staff', 'admin');
const recoveryTeamAccess = authorize('hospital_staff', 'admin'); // Could be more specific if you add a 'recovery_team' role
const transplantTeamAccess = authorize('hospital_staff', 'admin'); // Could be more specific for 'transplant_team'

// --- Routes for Hospital Staff / Admin ---

// ... (existing routes) ...

// POST: Hospital staff registers a recovered organ for an existing, consented donor
router.post(
    '/register-organ', // This endpoint will now be used for registering an organ for an existing donor
    protect,
    hospitalAccess, // Ensure hospital_staff or admin
    hospitalController.registerOrganForDonor
);

// PUT: Hospital staff updates a specific donor's health details after a checkup
// :donorDbId is the Mongoose _id of the Donor document
router.put(
    '/donor-health/:donorDbId',
    protect,                // User must be logged in
    hospitalAccess,         // User must be hospital_staff or admin
    hospitalController.updateDonorHealthByHospital
);

// POST: Hospital staff submits a new request for an organ for a patient
router.post(
    '/request-organ',
    protect,
    hospitalAccess,
    hospitalController.requestOrgan
);

// GET: Hospital staff finds potential matches for a specific organ request ID
// :organRequestId is the Mongoose _id of the OrganRequest document
router.get(
    '/find-matches/:organRequestId',
    protect,
    hospitalAccess,
    hospitalController.findMatchesForRequest
);

// POST: Hospital staff selects a match and initiates the organ transfer/allocation process
router.post(
    '/initiate-transplant',
    protect,
    hospitalAccess,
    hospitalController.initiateOrganTransfer
);

// POST: Hospital staff (typically recovery hospital) records that an organ has been recovered
// :transplantLogId is the Mongoose _id of the TransplantLog document
router.post(
    '/record-recovery/:transplantLogId',
    protect,
    recoveryTeamAccess, // Or general hospitalAccess
    hospitalController.recordOrganRecovery
);

// POST: Hospital staff (typically recipient hospital) records the completion of a transplant
// :transplantLogId is the Mongoose _id of the TransplantLog document
router.post(
    '/record-completion/:transplantLogId',
    protect,
    transplantTeamAccess, // Or general hospitalAccess
    hospitalController.recordTransplantCompletion
);


// Example: A route for a hospital to get a list of organ requests they've made (if needed)
// router.get(
//     '/my-organ-requests',
//     protect,
//     hospitalAccess,
//     hospitalController.getMyOrganRequests // You would need to create this controller function
// );

// Example: A route for a hospital to view details of a specific transplant they are involved in (if needed)
// router.get(
//     '/transplant-details/:transplantLogId',
//     protect,
//     hospitalAccess,
//     hospitalController.getHospitalTransplantDetails // You would need to create this
// );


module.exports = router;