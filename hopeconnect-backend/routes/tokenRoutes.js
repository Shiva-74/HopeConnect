const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { protect } = require('../middleware/authMiddleware'); // All token operations require login

router.get(
    '/balance',
    protect, // User must be logged in to see their own balance
    tokenController.getTokenBalance
);
router.post(
    '/redeem',
    protect, // User must be logged in to redeem their tokens
    tokenController.redeemTokens
);

module.exports = router;