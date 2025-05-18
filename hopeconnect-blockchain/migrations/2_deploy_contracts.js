const DIDRegistry = artifacts.require("DIDRegistry");
const ConsentManager = artifacts.require("ConsentManager");
const OrganChain = artifacts.require("OrganChain");
const ImpactLedger = artifacts.require("ImpactLedger");
const HopeToken = artifacts.require("HopeToken");

module.exports = async function (deployer, network, accounts) {
    const adminAccount = accounts[0];
    const hospitalAccount1_eth_addr = accounts[1];
    const regulatorAccount1_eth_addr = accounts[2];
    const donorAuthAccount1_eth_addr = accounts[3];
    const logisticsAccount1_eth_addr = accounts[4];
    const didRegistrar_eth_addr = accounts[5];

    // Deploy DIDRegistry
    console.log("Deploying DIDRegistry...");
    await deployer.deploy(DIDRegistry);
    const didRegistryInstance = await DIDRegistry.deployed();
    console.log("DIDRegistry deployed at:", didRegistryInstance.address);

    // Assign DID_REGISTRAR_ROLE
    await didRegistryInstance.addDidRegistrar(didRegistrar_eth_addr, { from: adminAccount });
    console.log(`DID_REGISTRAR_ROLE granted to ${didRegistrar_eth_addr} on DIDRegistry`);

    // Deploy ConsentManager
    console.log("Deploying ConsentManager...");
    await deployer.deploy(ConsentManager, didRegistryInstance.address);
    const consentManagerInstance = await ConsentManager.deployed();
    console.log("ConsentManager deployed at:", consentManagerInstance.address);

    // Deploy OrganChain
    console.log("Deploying OrganChain...");
    await deployer.deploy(OrganChain, consentManagerInstance.address, didRegistryInstance.address);
    const organChainInstance = await OrganChain.deployed();
    console.log("OrganChain deployed at:", organChainInstance.address);

    // Deploy ImpactLedger
    console.log("Deploying ImpactLedger...");
    await deployer.deploy(ImpactLedger);
    const impactLedgerInstance = await ImpactLedger.deployed();
    console.log("ImpactLedger deployed at:", impactLedgerInstance.address);

    // Link ImpactLedger <-> OrganChain
    await organChainInstance.setImpactLedgerAddress(impactLedgerInstance.address, { from: adminAccount });
    await impactLedgerInstance.setOrganChainContract(organChainInstance.address, { from: adminAccount });
    console.log("OrganChain and ImpactLedger linked.");

    // Deploy HopeToken
    console.log("Deploying HopeToken...");
    await deployer.deploy(HopeToken, adminAccount);
    const hopeTokenInstance = await HopeToken.deployed();
    console.log("HopeToken deployed at:", hopeTokenInstance.address);

    // Assign platform roles across contracts
    console.log(`\nSetting up initial platform roles...`);

    if (hospitalAccount1_eth_addr) {
        console.log(`Assigning HOSPITAL_ROLE to: ${hospitalAccount1_eth_addr} on OrganChain`);
        await organChainInstance.addHospital(hospitalAccount1_eth_addr, { from: adminAccount });

        // Assign MINTER_ROLE on HopeToken to hospital
        const MINTER_ROLE = await hopeTokenInstance.MINTER_ROLE();
        await hopeTokenInstance.grantRole(MINTER_ROLE, hospitalAccount1_eth_addr, { from: adminAccount });
        console.log(`MINTER_ROLE granted to Hospital: ${hospitalAccount1_eth_addr}`);
    }

    if (regulatorAccount1_eth_addr) {
        console.log(`Assigning REGULATOR_ROLE to: ${regulatorAccount1_eth_addr} on OrganChain`);
        await organChainInstance.addRegulator(regulatorAccount1_eth_addr, { from: adminAccount });

        // Assign BURNER_ROLE on HopeToken to regulator
        const BURNER_ROLE = await hopeTokenInstance.BURNER_ROLE();
        await hopeTokenInstance.grantRole(BURNER_ROLE, regulatorAccount1_eth_addr, { from: adminAccount });
        console.log(`BURNER_ROLE granted to Regulator: ${regulatorAccount1_eth_addr}`);
    }

    if (donorAuthAccount1_eth_addr) {
        console.log(`Assigning DONOR_AUTH_ROLE to: ${donorAuthAccount1_eth_addr} on OrganChain`);
        await organChainInstance.addDonorAuth(donorAuthAccount1_eth_addr, { from: adminAccount });
        console.log(`Assigning DONOR_AUTH_ROLE to: ${donorAuthAccount1_eth_addr} on ConsentManager`);
        await consentManagerInstance.addDonorAuth(donorAuthAccount1_eth_addr, { from: adminAccount });
    }

    if (logisticsAccount1_eth_addr) {
        console.log(`Assigning LOGISTICS_ROLE to: ${logisticsAccount1_eth_addr} on OrganChain`);
        await organChainInstance.addLogisticsPartner(logisticsAccount1_eth_addr, { from: adminAccount });
    }

    console.log("Initial role setup complete.\n");

    // Confirm Role Assignments
    const hospitalRole = await organChainInstance.HOSPITAL_ROLE();
    const isHospital = await organChainInstance.hasRole(hospitalRole, hospitalAccount1_eth_addr);
    console.log(`Is ${hospitalAccount1_eth_addr} a Hospital? ${isHospital}`);

    const didRegRoleConst = await didRegistryInstance.DID_REGISTRAR_ROLE();
    const isDidReg = await didRegistryInstance.hasRole(didRegRoleConst, didRegistrar_eth_addr);
    console.log(`Is ${didRegistrar_eth_addr} a DID Registrar? ${isDidReg}`);
};
