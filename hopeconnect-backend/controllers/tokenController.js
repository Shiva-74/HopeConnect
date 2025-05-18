const User = require('../models/User');
const blockchainService = require('../services/blockchainService');
const RedemptionLog = require('../models/RedemptionLog'); // Assuming you create this

// @desc    Get HopeToken balance for the currently logged-in user
// @route   GET /api/tokens/balance
// @access  Private (User must be logged in)
exports.getTokenBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found." });

        if (!user.ethAddress) {
            return res.status(400).json({ message: "User does not have an Ethereum address configured." });
        }

        const balance = await blockchainService.getTokenBalance(user.ethAddress);
        res.json({
            ethAddress: user.ethAddress,
            balance: balance
        });
    } catch (error) {
        console.error("Get Token Balance error:", error);
        if (error.message.includes("contract not initialized") || error.message.includes("Web3 not initialized")) {
            return res.status(503).json({ message: 'Blockchain service unavailable.' });
        }
        res.status(500).json({ message: 'Server error fetching token balance.', details: error.message });
    }
};

// @desc    User initiates redemption of HopeTokens for a specific incentive
// @route   POST /api/tokens/redeem
// @access  Private (User must be logged in)
exports.redeemTokens = async (req, res) => {
    const { amountToRedeem, incentiveType, incentiveDetails } = req.body;
    const userId = req.user.id;

    if (!amountToRedeem || isNaN(parseFloat(amountToRedeem)) || parseFloat(amountToRedeem) <= 0) {
        return res.status(400).json({ message: "Invalid or missing amount to redeem." });
    }
    if (!incentiveType) {
        return res.status(400).json({ message: "Incentive type is required." });
    }

    const numericAmountToRedeem = parseFloat(amountToRedeem);

    try {
        const user = await User.findById(userId);
        if (!user || !user.ethAddress) {
            return res.status(400).json({ message: "User or user ETH address not found." });
        }

        const currentBalanceString = await blockchainService.getTokenBalance(user.ethAddress);
        const currentBalanceNumeric = parseFloat(currentBalanceString);

        if (currentBalanceNumeric < numericAmountToRedeem) {
            return res.status(400).json({ message: `Insufficient token balance. Current: ${currentBalanceString}, Needed: ${numericAmountToRedeem}` });
        }

        let burnTxHash;
        try {
            // The admin account (from .env) performs the burnForRedemption on behalf of the user.
            // The admin account MUST have BURNER_ROLE.
            console.log(`Admin attempting to burn ${numericAmountToRedeem} tokens for user ${user.ethAddress} via burnForRedemption.`);
            burnTxHash = await blockchainService.burnHopeTokensForRedemption(user.ethAddress, numericAmountToRedeem);
        } catch (burnError) {
            console.error("Blockchain burnForRedemption failed:", burnError.message);
            if (burnError.message.toLowerCase().includes("caller is not the burner") || burnError.message.toLowerCase().includes("accesscontrol")) {
                return res.status(500).json({ message: "Token burn failed: System error or insufficient permissions for burn operation."});
            }
            return res.status(500).json({ message: "Failed to burn tokens on blockchain.", details: burnError.message });
        }

        // Log the redemption
        const redemption = await RedemptionLog.create({
            userId: user._id,
            ethAddress: user.ethAddress,
            amountRedeemed: numericAmountToRedeem,
            incentiveType,
            incentiveDetails,
            blockchainTxHash: burnTxHash,
            status: 'processed' // Or 'pending_fulfillment'
        });

        console.log(`Incentive ${incentiveType} for user ${user.email} processed. Redemption ID: ${redemption._id}, Burn Tx: ${burnTxHash}`);
        const newBalanceString = await blockchainService.getTokenBalance(user.ethAddress);

        res.json({
            message: `Successfully redeemed ${numericAmountToRedeem} HopeTokens for ${incentiveType}.`,
            burnTransactionHash: burnTxHash,
            newBalance: newBalanceString,
            redemptionId: redemption._id
        });

    } catch (error) {
        console.error("Redeem Tokens controller error:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Server error processing token redemption.', details: error.message });
        }
    }
};