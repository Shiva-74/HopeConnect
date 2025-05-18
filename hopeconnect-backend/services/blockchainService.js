const { getOrganChainContract, getHopeTokenContract, getAdminAddress, getWeb3 } = require('../config/blockchain');

// Helper function to send transactions from the admin account
const sendTransaction = async (contractMethod, options = {}) => {
    const adminAddress = getAdminAddress();
    if (!adminAddress) {
        console.error("Admin address not configured or available. Cannot send transaction.");
        throw new Error("Admin address not configured for sending blockchain transactions.");
    }
    const web3 = getWeb3();
    if (!web3) {
        console.error("Web3 instance not available. Blockchain might not be initialized.");
        throw new Error("Web3 instance not available.");
    }

    try {
        const gasPrice = await web3.eth.getGasPrice();
        let estimatedGas;
        try {
            estimatedGas = await contractMethod.estimateGas({ from: adminAddress, ...options });
        } catch (gasError) {
            console.error(`Gas estimation failed for method. Error: ${gasError.message}`);
            throw gasError;
        }

        const gasLimit = Math.ceil(Number(estimatedGas) * 1.2); // Add 20% buffer
        console.log(`Sending tx from ${adminAddress}, gasPrice: ${gasPrice}, estimatedGas: ${estimatedGas}, gasLimit: ${gasLimit}`);

        const receipt = await contractMethod.send({
            from: adminAddress,
            gas: gasLimit.toString(),
            gasPrice: gasPrice.toString(),
            ...options
        });
        return receipt;
    } catch (error) {
        console.error(`Error sending transaction: ${error.message}`);
        if (error.receipt) {
            console.error("Transaction receipt with error:", error.receipt);
        }
        throw error;
    }
};


// --- OrganChain Contract Interactions ---

/**
 * Registers a new donor's profile (DID and ETH address) on the OrganChain smart contract.
 * @param {string} donorDid - The Decentralized Identifier of the donor.
 * @param {string} donorEthAddress - The Ethereum address of the donor.
 * @returns {Promise<string>} The transaction hash.
 */
const registerDonorOnChain = async (donorDid, donorEthAddress) => {
    const contract = getOrganChainContract();
    if (!contract) throw new Error("OrganChain contract not initialized.");
    const method = contract.methods.registerDonorProfileOnChain(donorDid, donorEthAddress);
    const receipt = await sendTransaction(method);
    console.log(`Donor profile for ${donorDid} registered on chain. TxHash: ${receipt.transactionHash}`);
    return receipt.transactionHash;
};

/**
 * Records donor consent on the OrganChain smart contract.
 * NOTE: This is a placeholder as OrganChain.sol doesn't have this function directly.
 */
const recordConsentOnChain = async (donorDid, consentDetailsHash) => {
    // const contract = getOrganChainContract();
    // if (!contract) throw new Error("OrganChain contract not initialized.");
    // Assuming a function like contract.methods.recordDonorConsent(donorDid, consentDetailsHash);
    // const method = contract.methods.recordDonorConsent(donorDid, consentDetailsHash);
    // const receipt = await sendTransaction(method);
    // console.log(`Consent for donor ${donorDid} (hash: ${consentDetailsHash}) recorded on chain. TxHash: ${receipt.transactionHash}`);
    // return receipt.transactionHash;
    console.warn("recordConsentOnChain: Function 'recordConsent' not found in OrganChain.sol. Skipping blockchain transaction for consent recording.");
    return "SKIPPED_CONSENT_BC_NO_FUNCTION";
};

/**
 * Updates the health score of a donor.
 * NOTE: This is a placeholder as OrganChain.sol doesn't have this function directly.
 */
const updateDonorHealthOnChain = async (donorDid, healthScore) => {
    // const contract = getOrganChainContract();
    // if (!contract) throw new Error("OrganChain contract not initialized.");
    // const scoreUint = Math.round(healthScore);
    // const method = contract.methods.updateDonorProfileHealth(donorDid, scoreUint);
    // const receipt = await sendTransaction(method);
    // console.log(`Health score for donor ${donorDid} updated to ${scoreUint} on chain. TxHash: ${receipt.transactionHash}`);
    // return receipt.transactionHash;
    console.warn("updateDonorHealthOnChain: Function for updating donor health directly by DID not found in OrganChain.sol. Skipping.");
    return "SKIPPED_HEALTH_BC_NO_FUNCTION";
};

// <<<--- THE FIRST (SIMPLER) DECLARATION OF registerOrganByHospitalOnChain WAS HERE AND HAS BEEN REMOVED ---<<<

/**
 * Updates the status of an organ on the OrganChain smart contract.
 * @param {string} organIdBlockchain - The blockchain ID of the organ (uint256).
 * @param {number} newStatusNumeric - The new status as a numeric value (matching your contract's enum).
 * @param {string} notes - Notes for the audit trail.
 * @param {string} newHolderDID - DID of the new holder, if applicable.
 * @returns {Promise<string>} The transaction hash.
 */
const updateOrganStatusOnChain = async (organIdBlockchain, newStatusNumeric, notes, newHolderDID = "") => {
    const contract = getOrganChainContract();
    if (!contract) throw new Error("OrganChain contract not initialized.");
    const method = contract.methods.updateOrganStatusByDID(organIdBlockchain, newStatusNumeric, notes, newHolderDID);
    const receipt = await sendTransaction(method);
    console.log(`Organ ID ${organIdBlockchain} status updated to ${newStatusNumeric}. TxHash: ${receipt.transactionHash}`);
    return receipt.transactionHash;
};

/**
 * Records the completion of a transplant on the OrganChain smart contract.
 * @param {string} organIdBlockchain - The blockchain ID of the organ.
 * @param {boolean} successful - Whether the transplant was successful.
 * @param {string} anonymizedRecipientInfo - Anonymized info about the recipient.
 * @param {string} notes - Notes for the audit trail.
 * @returns {Promise<string>} The transaction hash.
 */
const recordTransplantOutcomeOnChain = async (organIdBlockchain, successful, anonymizedRecipientInfo, notes) => {
    const contract = getOrganChainContract();
    if (!contract) throw new Error("OrganChain contract not initialized.");
    const method = contract.methods.recordTransplantOutcome(organIdBlockchain, successful, anonymizedRecipientInfo, notes);
    const receipt = await sendTransaction(method);
    console.log(`Transplant outcome for organ ID ${organIdBlockchain} recorded as ${successful}. TxHash: ${receipt.transactionHash}`);
    return receipt.transactionHash;
};


// --- HopeToken Contract Interactions ---

const awardHopeTokens = async (recipientAddress, amount) => {
    const tokenContract = getHopeTokenContract();
    const web3 = getWeb3();
    if (!tokenContract || !web3) throw new Error("HopeToken contract or Web3 not initialized.");
    const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
    const method = tokenContract.methods.mint(recipientAddress, amountInWei);
    const receipt = await sendTransaction(method);
    console.log(`${amount} HopeTokens awarded to ${recipientAddress}. TxHash: ${receipt.transactionHash}`);
    return receipt.transactionHash;
};

const burnHopeTokens = async (ownerAddress, amount) => { // This might need review based on HopeToken.sol's burn/burnFrom logic
    const tokenContract = getHopeTokenContract();
    const web3 = getWeb3();
    if (!tokenContract || !web3) throw new Error("HopeToken contract or Web3 not initialized.");
    const amountInWei = web3.utils.toWei(amount.toString(), 'ether');
    // Assuming admin calls burnFrom, requiring ownerAddress to have approved admin for the amount.
    // If admin is to burn directly from any account, contract needs `burn(address account, uint256 amount)` accessible by admin.
    // Or if only owner can burn their own tokens, this function should not be called by admin directly for others.
    // For now, assuming burnFrom is the intended mechanism if admin is involved.
    // If HopeToken has `burn(uint256 amount)` and admin has MINTER_ROLE (which usually also implies BURNE‌R_ROLE or similar permissions),
    // and admin wants to burn its *own* tokens, then it would be `tokenContract.methods.burn(amountInWei)`.
    // If admin is burning *other* user's tokens, it needs approval for burnFrom or a special contract function.
    // Let's stick to burnFrom for now if it's about user tokens and admin has approval.
    // If it's `burnForRedemption` (see below), that's different.
    const method = tokenContract.methods.burnFrom(ownerAddress, amountInWei); // CHECK THIS LOGIC
    const receipt = await sendTransaction(method);
    console.log(`${amount} HopeTokens burnt from ${ownerAddress}. TxHash: ${receipt.transactionHash}`);
    return receipt.transactionHash;
};


const burnHopeTokensForRedemption = async (userAddressToBurnFrom, amount) => {
    const tokenContract = getHopeTokenContract();
    const web3 = getWeb3();
    if (!tokenContract || !web3) throw new Error("HopeToken contract or Web3 not initialized.");

    const adminAddress = getAdminAddress();
    if (!adminAddress) {
        throw new Error("Admin address for burning tokens is not configured.");
    }

    const amountInWei = web3.utils.toWei(amount.toString(), 'ether');

    console.log(`Admin ${adminAddress} initiating burnForRedemption of ${amount} tokens from user ${userAddressToBurnFrom}.`);

    const method = tokenContract.methods.burnForRedemption(userAddressToBurnFrom, amountInWei);

    const receipt = await sendTransaction(method, { from: adminAddress });

    console.log(`${amount} HopeTokens burnt for redemption from ${userAddressToBurnFrom} by admin. TxHash: ${receipt.transactionHash}`);
    return receipt.transactionHash;
};


// This is the more complete version of registerOrganByHospitalOnChain
const ORGAN_TYPES_ENUM_ORDER = ["Heart", "Lung", "Liver", "Kidney", "Pancreas", "Intestine", "Cornea", "Skin", "Bone"]; // Ensure this matches OrganChain.OrganType enum

const registerOrganByHospitalOnChain = async (donorDid, organTypeString, recoveryHospitalDid) => {
    const contract = getOrganChainContract();
    if (!contract) throw new Error("OrganChain contract not initialized.");

    const organTypeNumeric = ORGAN_TYPES_ENUM_ORDER.indexOf(organTypeString);
    if (organTypeNumeric === -1) {
        throw new Error(`Invalid organ type string: ${organTypeString}. Cannot map to contract enum.`);
    }

    const adminAddress = getAdminAddress(); // This admin account must have HOSPITAL_ROLE
     if (!adminAddress) {
        throw new Error("Admin address for blockchain transactions is not configured.");
    }

    console.log(`Admin ${adminAddress} (acting as hospital) registering organ: DonorDID=${donorDid}, OrganTypeNumeric=${organTypeNumeric}, HospitalDID=${recoveryHospitalDid}`);
    const method = contract.methods.registerOrgan(donorDid, organTypeNumeric, recoveryHospitalDid);

    const receipt = await sendTransaction(method); // Sent from adminAddress

    let organIdBlockchain = null;
    if (receipt.events && receipt.events.OrganRegisteredForDID && receipt.events.OrganRegisteredForDID.returnValues) {
        organIdBlockchain = receipt.events.OrganRegisteredForDID.returnValues.organId.toString();
        console.log(`Organ registered on chain. OrganChain ID: ${organIdBlockchain}, TxHash: ${receipt.transactionHash}`);
    } else {
        console.warn(`OrganRegisteredForDID event not found or organId missing in receipt for Tx: ${receipt.transactionHash}. Manual check needed for organId.`);
    }

    return {
        transactionHash: receipt.transactionHash,
        organIdBlockchain: organIdBlockchain
    };
};


const getTokenBalance = async (address) => {
    const tokenContract = getHopeTokenContract();
    const web3 = getWeb3();
    if (!tokenContract || !web3) throw new Error("HopeToken contract or Web3 not initialized.");
    const balanceWei = await tokenContract.methods.balanceOf(address).call();
    return web3.utils.fromWei(balanceWei, 'ether');
};


// --- Getter functions from OrganChain ---

const getDonorEthAddressFromChain = async (donorDid) => {
    const contract = getOrganChainContract();
    if (!contract) throw new Error("OrganChain contract not initialized.");
    try {
        return await contract.methods.getDonorEthAddress(donorDid).call();
    } catch (error) {
        console.error(`Error fetching donor ETH address for ${donorDid} from chain: ${error.message}`);
        return null;
    }
};

const getOrganDetailsFromChain = async (organIdBlockchain) => {
    const contract = getOrganChainContract();
    if (!contract) throw new Error("OrganChain contract not initialized.");
    try {
        return await contract.methods.getOrganDetails(organIdBlockchain).call();
    } catch (error) {
        console.error(`Error fetching organ details for ID ${organIdBlockchain} from chain: ${error.message}`);
        return null;
    }
};

const getPastEvents = async (eventName, filterOptions = {}, fromBlock = 0) => {
    const contract = getOrganChainContract();
    if (!contract) throw new Error("OrganChain contract not initialized.");
    try {
        return await contract.getPastEvents(eventName, {
            filter: filterOptions,
            fromBlock: fromBlock,
            toBlock: 'latest'
        });
    } catch (error) {
        console.error(`Error fetching past events '${eventName}': ${error.message}`);
        return [];
    }
};


module.exports = {
    registerDonorOnChain,
    recordConsentOnChain,
    updateDonorHealthOnChain,
    registerOrganByHospitalOnChain, // This now correctly refers to the single, more complete implementation
    updateOrganStatusOnChain,
    recordTransplantOutcomeOnChain,
    awardHopeTokens,
    burnHopeTokens, // Review if burnFrom is always appropriate or if direct burn by admin of their own tokens is needed
    burnHopeTokensForRedemption,
    // No need to list registerOrganByHospitalOnChain twice here
    getTokenBalance,
    getDonorEthAddressFromChain,
    getOrganDetailsFromChain,
    getPastEvents,
};