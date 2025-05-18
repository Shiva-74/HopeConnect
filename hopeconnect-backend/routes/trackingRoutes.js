const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const { protect, authorize } = require('../middleware/authMiddleware');

// GET audit trail - can be public or require login, adjust 'protect' as needed
// If it contains sensitive info, add 'protect'
router.get(
    '/:trackingId', // trackingId is the TransplantLog Mongoose _id
    // protect, // Uncomment if login is required to view any audit trail
    trackingController.getAuditTrail
);

// POST to update status - requires specific roles
router.post(
    '/:transplantLogId/update-status',
    protect,
    authorize('logistics_provider', 'hospital_staff', 'admin'), // Define roles that can update
    trackingController.updateTransportAndOtherStatus
);

module.exports = router;