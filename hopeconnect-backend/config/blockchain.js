// const Web3_v1 = require('web3'); // Keep old for reference if needed, but we'll use v4
const { Web3 } = require('web3'); // Correct import for Web3.js v4.x
require('dotenv').config();
const fs = require('fs');
const path = require('path');

let web3;
let organChainContract;
let hopeTokenContract;
let adminAccount;

const initBlockchain = () => {
    try {
        if (!process.env.ETH_NODE_URL) throw new Error("ETH_NODE_URL not defined in .env");

        // Correct instantiation for Web3.js v4.x
        web3 = new Web3(process.env.ETH_NODE_URL);
        console.log('Attempting to connect to Ethereum node at:', process.env.ETH_NODE_URL);

        // Optional: Test connection (can be asynchronous, might not complete before next lines)
        web3.eth.getNodeInfo()
            .then(info => console.log("Successfully connected to Ethereum node:", info.substring(0, 50) + "...")) // Log truncated info
            .catch(err => console.error("Could not get node info (this might be okay if node is slow to respond, but check if Ganache is running):", err.message));


        const organChainAbiPath = path.resolve(__dirname, '../abis/OrganChain.json');
        const hopeTokenAbiPath = path.resolve(__dirname, '../abis/HopeToken.json');

        if (!fs.existsSync(organChainAbiPath)) throw new Error(`OrganChain.json ABI not found at ${organChainAbiPath}`);
        if (!fs.existsSync(hopeTokenAbiPath)) throw new Error(`HopeToken.json ABI not found at ${hopeTokenAbiPath}`);

        const organChainAbi = JSON.parse(fs.readFileSync(organChainAbiPath, 'utf8')).abi;
        const hopeTokenAbi = JSON.parse(fs.readFileSync(hopeTokenAbiPath, 'utf8')).abi;

        if (!process.env.ORGAN_CHAIN_CONTRACT_ADDRESS) throw new Error("ORGAN_CHAIN_CONTRACT_ADDRESS not defined in .env");
        if (!process.env.HOPE_TOKEN_CONTRACT_ADDRESS) throw new Error("HOPE_TOKEN_CONTRACT_ADDRESS not defined in .env");

        organChainContract = new web3.eth.Contract(organChainAbi, process.env.ORGAN_CHAIN_CONTRACT_ADDRESS);
        hopeTokenContract = new web3.eth.Contract(hopeTokenAbi, process.env.HOPE_TOKEN_CONTRACT_ADDRESS);

        console.log('OrganChain Contract initialized at:', process.env.ORGAN_CHAIN_CONTRACT_ADDRESS);
        console.log('HopeToken Contract initialized at:', process.env.HOPE_TOKEN_CONTRACT_ADDRESS);

        if (process.env.ADMIN_ETH_PRIVATE_KEY) {
            const privateKey = process.env.ADMIN_ETH_PRIVATE_KEY.startsWith('0x')
                             ? process.env.ADMIN_ETH_PRIVATE_KEY
                             : '0x' + process.env.ADMIN_ETH_PRIVATE_KEY;
            // For Web3.js v4.x, addAccount is preferred for local wallet
            adminAccount = web3.eth.accounts.privateKeyToAccount(privateKey);
            web3.eth.accounts.wallet.add(adminAccount); // Adds to an in-memory wallet
            // web3.eth.defaultAccount = adminAccount.address; // Setting defaultAccount is still useful for calls
            console.log('Admin ETH account loaded and added to wallet:', adminAccount.address);
        } else {
            console.warn('ADMIN_ETH_PRIVATE_KEY not set. Server-side blockchain transactions will fail.');
        }
        console.log("Blockchain initialization logic completed."); // Changed from "successful" to "logic completed"
                                                                 // as node connection test is async
    } catch (error) {
        console.error('Blockchain initialization failed:', error.message);
        console.error('Please ensure your .env file is correct, Ganache is running on the correct port (e.g., 7545 or 8545), contracts are deployed, and ABIs are in the abis/ directory.');
        // process.exit(1); // Comment out for dev if you want server to start even if BC fails
    }
};

// Getter functions remain the same
const getWeb3 = () => web3;
const getOrganChainContract = () => organChainContract;
const getHopeTokenContract = () => hopeTokenContract;
const getAdminAddress = () => process.env.ADMIN_ETH_ADDRESS || (adminAccount ? adminAccount.address : null);

module.exports = {
    initBlockchain,
    getWeb3,
    getOrganChainContract,
    getHopeTokenContract,
    getAdminAddress,
};