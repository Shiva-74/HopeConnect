// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./AccessControlRoles.sol"; // Ensure this path is correct
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IConsentManager.sol"; // Ensure these interface paths are correct
import "./interfaces/IDIDRegistry.sol";
import "./interfaces/IImpactLedger.sol";

contract OrganChain is AccessControlRoles {
    using Counters for Counters.Counter;
    Counters.Counter private _organIds;
    Counters.Counter private _transplantLogIds;

    // --- Enums (Keep as they are) ---
    enum RecipientGroupPreference { Unspecified, Local, National, International, Research } // Legacy
    enum OrganStatus { Registered, RecoveryInProgress, Recovered, AwaitingTransport, InTransport, DeliveredToHospital, Matched, TransplantScheduled, TransplantPendingMultiSig, TransplantCompleted, TransplantFailed, Discarded, Other }
    enum OrganType { Heart, Lung, Liver, Kidney, Pancreas, Intestine, Cornea, Skin, Bone }

    // --- Structs (Keep as they are) ---
    struct Organ {
        uint256 id;
        string donorDID;
        OrganType organType;
        address recoveryHospitalDIDOwner; // Owner of the recovery hospital's DID
        uint256 recoveryTimestamp; // Timestamp of organ registration or recovery by hospital
        OrganStatus status;
        string currentHolderIdentifierDID; // DID of the current entity responsible (hospital, logistics)
        uint256 lastUpdatedTimestamp;
        string matchedRecipientDID;
        uint256 transplantLogId; // Link to the TransplantLog entry
        address[] multiSigApprovers;
        mapping(address => bool) multiSigConfirmations;
        uint256 requiredMultiSigApprovals;
        bool multiSigApproved;
    }

    struct AuditEvent {
        uint256 organId;
        uint256 timestamp;
        OrganStatus statusChange;
        address performedByEthAddress; // ETH address of the msg.sender
        string performedByDID; // DID of the actor
        string notes;
    }

    struct TransplantLog {
        uint256 id;
        uint256 organId;
        string donorDID;
        string recipientDID;
        address transplantHospitalDIDOwner; // ETH address of the transplant hospital DID owner
        uint256 completionTimestamp;
        bool successful;
        string anonymizedRecipientInfo; // e.g., "Adult Male, Blood Type O+"
    }

    // --- Mappings (Keep as they are, plus new ones for donor profile) ---
    mapping(uint256 => Organ) public organs;
    mapping(uint256 => AuditEvent[]) public organAuditTrail;
    mapping(uint256 => TransplantLog) public transplantLogs;

    // New mappings for simple donor profile registration
    mapping(string => address) public donorDIDToEthAddress;
    mapping(string => bool) public isDonorDIDRegistered;

    // --- Interfaces (Keep as they are) ---
    IConsentManager public consentManager;
    IDIDRegistry public didRegistry;
    IImpactLedger public impactLedger;

    // --- Events (Keep as they are, plus new one) ---
    event OrganRegisteredForDID(string indexed donorDID, uint256 indexed organId, OrganType organType, uint256 timestamp);
    event OrganStatusUpdated(uint256 indexed organId, OrganStatus newStatus, string indexed performedByDID, uint256 timestamp, string notes);
    event TransplantRecorded(uint256 indexed transplantLogId, uint256 indexed organId, string indexed donorDID, bool successful, uint256 timestamp);
    event MultiSigInitiated(uint256 indexed organId, address[] approvers, uint256 requiredApprovals);
    event MultiSigApproved(uint256 indexed organId, address indexed approver);
    event OrganReleasedForTransplant(uint256 indexed organId);

    // New event for donor profile registration
    event DonorProfileRegistered(string indexed donorDID, address indexed donorEthAddress, uint256 timestamp);


    // --- Constructor (Keep as it is) ---
    constructor(address _consentManagerAddress, address _didRegistryAddress) AccessControlRoles() {
        require(_consentManagerAddress != address(0), "OC: Invalid ConsentManager");
        require(_didRegistryAddress != address(0), "OC: Invalid DIDRegistry");
        consentManager = IConsentManager(_consentManagerAddress);
        didRegistry = IDIDRegistry(_didRegistryAddress);
        // Grant DEFAULT_ADMIN_ROLE to the deployer (msg.sender)
        // This is typically handled in AccessControlRoles or OpenZeppelin's AccessControl constructor
    }

    // --- setImpactLedgerAddress (Keep as it is) ---
    function setImpactLedgerAddress(address _ledgerAddress) external onlyAdminRole {
        impactLedger = IImpactLedger(_ledgerAddress);
    }

    // --- _getActorDID (Keep as it is) ---
    function _getActorDID(address _actorEthAddress) internal view returns (string memory) {
        string memory actorDID = didRegistry.getDIDByOwner(_actorEthAddress);
        require(bytes(actorDID).length > 0, "OC: Actor ETH address has no registered DID");
        return actorDID;
    }

    // --- NEW FUNCTION: registerDonorProfileOnChain ---
    /**
     * @notice Registers a donor's profile (DID and ETH address) on the chain.
     * @dev Can be called by an admin or a designated donor registrar.
     * @param _donorDID The Decentralized Identifier of the donor.
     * @param _donorEthAddress The Ethereum address associated with the donor for rewards/identification.
     */
    function registerDonorProfileOnChain(string calldata _donorDID, address _donorEthAddress)
        external
        onlyAdminRole // Or a new role like DONOR_REGISTRAR_ROLE, or make it public if desired
    {
        require(bytes(_donorDID).length > 0, "OC: Donor DID cannot be empty");
        require(_donorEthAddress != address(0), "OC: Donor ETH address cannot be zero");
        require(!isDonorDIDRegistered[_donorDID], "OC: This Donor DID is already registered");
        // Optional: Check if _donorEthAddress is already linked to another DID via didRegistry
        // string memory existingDIDForAddress = didRegistry.getDIDByOwner(_donorEthAddress);
        // require(bytes(existingDIDForAddress).length == 0, "OC: ETH address already linked to another DID");

        donorDIDToEthAddress[_donorDID] = _donorEthAddress;
        isDonorDIDRegistered[_donorDID] = true;

        emit DonorProfileRegistered(_donorDID, _donorEthAddress, block.timestamp);
    }

    // --- registerOrgan (Keep as it is, with your replacement code) ---
    function registerOrgan(
        string calldata _donorDID,
        OrganType _organType,
        string calldata _recoveryHospitalDID
    ) external onlyHospitalRole returns (uint256) {
        require(didRegistry.isDIDValid(_donorDID), "OC: Donor DID invalid");
        // Ensure donor profile is registered first if that's a requirement
        require(isDonorDIDRegistered[_donorDID], "OC: Donor profile not registered on OrganChain");

        IDIDRegistry.IdentityRecord memory hospitalRecord = didRegistry.getDIDRecord(_recoveryHospitalDID);
        require(hospitalRecord.isValid && hospitalRecord.idType == IDIDRegistry.IdentityType.Hospital, "OC: Hospital DID invalid/not Hospital");
        require(hospitalRecord.ownerAddress == _msgSender(), "OC: Caller not hospital DID owner");

        (bool canDonate,,) = consentManager.getConsent(_donorDID, _organType);
        require(canDonate, "OC: Consent not found for organ type or donation not permitted");

        _organIds.increment();
        uint256 newOrganId = _organIds.current();

        Organ storage newOrgan = organs[newOrganId]; // Get a storage pointer

        newOrgan.id = newOrganId;
        newOrgan.donorDID = _donorDID;
        newOrgan.organType = _organType;
        newOrgan.recoveryHospitalDIDOwner = hospitalRecord.ownerAddress;
        newOrgan.recoveryTimestamp = block.timestamp; // Or a timestamp provided by hospital
        newOrgan.status = OrganStatus.Registered;
        newOrgan.currentHolderIdentifierDID = _recoveryHospitalDID;
        newOrgan.lastUpdatedTimestamp = block.timestamp;
        newOrgan.matchedRecipientDID = "";
        newOrgan.transplantLogId = 0;
        newOrgan.requiredMultiSigApprovals = 0;
        newOrgan.multiSigApproved = false;

        _logAuditEvent(newOrganId, OrganStatus.Registered, _getActorDID(_msgSender()), "Organ registered by hospital");
        emit OrganRegisteredForDID(_donorDID, newOrganId, _organType, block.timestamp);
        return newOrganId;
    }

    // --- updateOrganStatusByDID (Keep as it is) ---
    function updateOrganStatusByDID(uint256 _organId, OrganStatus _newStatus, string calldata _notes, string calldata _newHolderDID)
        external
        // Add role checks appropriate for status changes if not covered by holder check
    {
        Organ storage organ = organs[_organId];
        require(organ.id != 0, "OC: Organ not found");

        string memory actorDID = _getActorDID(_msgSender());

        // Example more granular role/holder checks:
        if (_newStatus == OrganStatus.Recovered || _newStatus == OrganStatus.AwaitingTransport) {
             require(hasRole(HOSPITAL_ROLE, _msgSender()), "OC: Not hospital role for recovery status");
             IDIDRegistry.IdentityRecord memory currentHolderRecord = didRegistry.getDIDRecord(organ.currentHolderIdentifierDID);
             require(currentHolderRecord.ownerAddress == _msgSender(), "OC: Caller not current designated holder for recovery");
        } else if (_newStatus == OrganStatus.InTransport || _newStatus == OrganStatus.DeliveredToHospital) {
             require(hasRole(LOGISTICS_ROLE, _msgSender()), "OC: Not logistics role for transport status");
             // Optionally, check if msgSender is owner of organ.currentHolderIdentifierDID if it's a logistics DID
        }
        // Add checks for other statuses like TransplantCompleted (should be by transplant hospital)

        if (bytes(_newHolderDID).length > 0) {
            require(didRegistry.isDIDValid(_newHolderDID), "OC: New holder DID invalid");
            organ.currentHolderIdentifierDID = _newHolderDID;
        }
        organ.status = _newStatus;
        organ.lastUpdatedTimestamp = block.timestamp;
        _logAuditEvent(_organId, _newStatus, actorDID, _notes);
        emit OrganStatusUpdated(_organId, _newStatus, actorDID, block.timestamp, _notes);
    }


    // --- setOrganAsMatchedWithConsentCheck (Keep as it is) ---
    function setOrganAsMatchedWithConsentCheck(
        uint256 _organId,
        string calldata _recipientDID,
        IConsentManager.RecipientScope _matchScope,
        IConsentManager.OrganUsage _matchUsage,
        string calldata _notes
    ) external onlyAdminRole { // Or perhaps a HOSPITAL_ROLE with checks
        Organ storage organ = organs[_organId];
        require(organ.id != 0, "OC: Organ not found");
        require(organ.status == OrganStatus.Recovered || organ.status == OrganStatus.AwaitingTransport || organ.status == OrganStatus.DeliveredToHospital, "OC: Organ not ready for matching");
        require(didRegistry.isDIDValid(_recipientDID), "OC: Recipient DID invalid");

        bool consentCompatible = consentManager.checkConsentCompatibility(organ.donorDID, organ.organType, _matchScope, _matchUsage);
        require(consentCompatible, "OC: Match violates donor consent parameters");

        organ.matchedRecipientDID = _recipientDID;
        organ.status = OrganStatus.Matched;
        organ.lastUpdatedTimestamp = block.timestamp;
        _logAuditEvent(_organId, OrganStatus.Matched, _getActorDID(_msgSender()), _notes); // Use _getActorDID if admin has one
        // _logAuditEvent(_organId, OrganStatus.Matched, "System/Admin", _notes); // Or keep as System/Admin
        emit OrganStatusUpdated(_organId, OrganStatus.Matched, _getActorDID(_msgSender()), block.timestamp, _notes);
    }

    // --- initiateMultiSigRelease (Keep as it is) ---
    function initiateMultiSigRelease(uint256 _organId, address[] calldata _approvers, uint256 _requiredApprovals)
        external onlyAdminRole {
        Organ storage organ = organs[_organId];
        require(organ.id != 0, "OC: Organ not found");
        require(organ.status == OrganStatus.Matched || organ.status == OrganStatus.TransplantScheduled, "OC: Organ not in correct state for multi-sig initiation"); // Allow if already scheduled too
        require(_approvers.length >= _requiredApprovals && _requiredApprovals > 0, "OC: Invalid approvers/reqs");

        for(uint i=0; i < _approvers.length; i++){
            require(hasRole(REGULATOR_ROLE, _approvers[i]) || hasRole(ADMIN_ROLE, _approvers[i]), "OC: Approver lacks required role");
        }

        organ.multiSigApprovers = _approvers;
        organ.requiredMultiSigApprovals = _requiredApprovals;
        organ.multiSigApproved = false; // Reset approval status
        for (uint i = 0; i < organ.multiSigApprovers.length; i++) { // Clear previous confirmations
            organ.multiSigConfirmations[organ.multiSigApprovers[i]] = false;
        }
        organ.status = OrganStatus.TransplantPendingMultiSig;
        organ.lastUpdatedTimestamp = block.timestamp;
        _logAuditEvent(_organId, OrganStatus.TransplantPendingMultiSig, _getActorDID(_msgSender()), "Multi-sig for transplant release initiated");
        emit MultiSigInitiated(_organId, _approvers, _requiredApprovals);
    }

    // --- approveOrganRelease (Keep as it is) ---
    function approveOrganRelease(uint256 _organId) external { // No role restriction, relies on approver list
        Organ storage organ = organs[_organId];
        require(organ.id != 0, "OC: Organ not found");
        require(organ.status == OrganStatus.TransplantPendingMultiSig, "OC: Not pending multi-sig");

        bool isApprover = false;
        for (uint i = 0; i < organ.multiSigApprovers.length; i++) {
            if (organ.multiSigApprovers[i] == _msgSender()) {
                isApprover = true;
                break;
            }
        }
        require(isApprover, "OC: Caller is not an authorized approver for this organ");
        require(!organ.multiSigConfirmations[_msgSender()], "OC: Caller has already approved");

        organ.multiSigConfirmations[_msgSender()] = true;
        emit MultiSigApproved(_organId, _msgSender());

        uint256 confirmationCount = 0;
        for (uint i = 0; i < organ.multiSigApprovers.length; i++) {
            if (organ.multiSigConfirmations[organ.multiSigApprovers[i]]) {
                confirmationCount++;
            }
        }

        if (confirmationCount >= organ.requiredMultiSigApprovals) {
            organ.multiSigApproved = true;
            organ.status = OrganStatus.TransplantScheduled; // Status after successful multi-sig
            organ.lastUpdatedTimestamp = block.timestamp;
            _logAuditEvent(_organId, OrganStatus.TransplantScheduled, _getActorDID(_msgSender()), "Multi-sig approved, organ scheduled for transplant");
            emit OrganReleasedForTransplant(_organId);
        }
    }

    // --- recordTransplantOutcome (Keep as it is) ---
    function recordTransplantOutcome(
        uint256 _organId,
        bool _successful,
        string calldata _anonymizedRecipientInfo,
        string calldata _notes
    ) external onlyHospitalRole { // Should be transplant hospital
        Organ storage organ = organs[_organId];
        require(organ.id != 0, "OC: Organ not found");

        if (organ.requiredMultiSigApprovals > 0) {
           require(organ.multiSigApproved, "OC: Organ release not multi-sig approved");
        }
        // Allow outcome recording from various relevant states
        require(organ.status == OrganStatus.TransplantScheduled || organ.status == OrganStatus.DeliveredToHospital || organ.status == OrganStatus.TransplantPendingMultiSig /* if multi-sig was bypassed for emergency */, "OC: Organ not in state for transplant outcome");

        // Verify caller is the owner of the currentHolderIdentifierDID (expected to be transplant hospital DID)
        IDIDRegistry.IdentityRecord memory hospitalRecord = didRegistry.getDIDRecord(organ.currentHolderIdentifierDID);
        require(hospitalRecord.isValid && hospitalRecord.ownerAddress == _msgSender(), "OC: Caller not current holder (transplant hospital DID owner)");

        _transplantLogIds.increment();
        uint256 newLogId = _transplantLogIds.current();

        transplantLogs[newLogId] = TransplantLog({
            id: newLogId,
            organId: _organId,
            donorDID: organ.donorDID,
            recipientDID: organ.matchedRecipientDID,
            transplantHospitalDIDOwner: _msgSender(),
            completionTimestamp: block.timestamp,
            successful: _successful,
            anonymizedRecipientInfo: _anonymizedRecipientInfo
        });

        organ.transplantLogId = newLogId;
        organ.status = _successful ? OrganStatus.TransplantCompleted : OrganStatus.TransplantFailed;
        organ.lastUpdatedTimestamp = block.timestamp;

        string memory actorDID = _getActorDID(_msgSender());
        _logAuditEvent(_organId, organ.status, actorDID, _notes);
        emit TransplantRecorded(newLogId, _organId, organ.donorDID, _successful, block.timestamp);

        if (address(impactLedger) != address(0) && _successful) {
            impactLedger.recordSuccessfulTransplant(organ.donorDID, organ.matchedRecipientDID, organ.organType);
        }
    }

    // --- verifyEligibilityWithZKP (Keep as it is) ---
    function verifyEligibilityWithZKP(string calldata _recipientDID, bytes calldata _zkProof, uint256[] calldata _publicInputs)
        external view returns (bool) {
        require(didRegistry.isDIDValid(_recipientDID), "OC: Recipient DID for ZKP invalid");
        // Actual ZKP verification logic would go here
        return (_zkProof.length > 0 && _publicInputs.length > 0); // Placeholder
    }

    // --- _logAuditEvent (Keep as it is) ---
    function _logAuditEvent(uint256 _organId, OrganStatus _statusChange, string memory _actorDID, string memory _notes) internal {
        organAuditTrail[_organId].push(AuditEvent({
            organId: _organId,
            timestamp: block.timestamp,
            statusChange: _statusChange,
            performedByEthAddress: _msgSender(),
            performedByDID: _actorDID,
            notes: _notes
        }));
    }

    // --- Getter Functions (Keep as they are) ---
    function getOrganDetails(uint256 _organId)
        external view
        returns (
            uint256 id,
            string memory donorDID,
            OrganType organType,
            address recoveryHospitalDIDOwner,
            uint256 recoveryTimestamp,
            OrganStatus status,
            string memory currentHolderIdentifierDID,
            uint256 lastUpdatedTimestamp,
            string memory matchedRecipientDID,
            uint256 transplantLogId,
            address[] memory multiSigApprovers,
            uint256 requiredMultiSigApprovals,
            bool multiSigApproved
        )
    {
        Organ storage organToReturn = organs[_organId];
        require(organToReturn.id != 0, "OC: Organ not found");

        id = organToReturn.id;
        donorDID = organToReturn.donorDID;
        organType = organToReturn.organType;
        recoveryHospitalDIDOwner = organToReturn.recoveryHospitalDIDOwner;
        recoveryTimestamp = organToReturn.recoveryTimestamp;
        status = organToReturn.status;
        currentHolderIdentifierDID = organToReturn.currentHolderIdentifierDID;
        lastUpdatedTimestamp = organToReturn.lastUpdatedTimestamp;
        matchedRecipientDID = organToReturn.matchedRecipientDID;
        transplantLogId = organToReturn.transplantLogId;
        multiSigApprovers = organToReturn.multiSigApprovers;
        requiredMultiSigApprovals = organToReturn.requiredMultiSigApprovals;
        multiSigApproved = organToReturn.multiSigApproved;
    }

    function getOrganMultiSigConfirmation(uint256 _organId, address _approver)
        external view returns (bool isConfirmed)
    {
        Organ storage organToCheck = organs[_organId];
        require(organToCheck.id != 0, "OC: Organ not found for multi-sig check");
        bool isAnApprover = false;
        for(uint i = 0; i < organToCheck.multiSigApprovers.length; i++) {
            if (organToCheck.multiSigApprovers[i] == _approver) {
                isAnApprover = true;
                break;
            }
        }
        if (!isAnApprover) {
            return false;
        }
        return organToCheck.multiSigConfirmations[_approver];
    }

    function getTransplantLog(uint256 _logId) external view returns (TransplantLog memory) {
        require(transplantLogs[_logId].id != 0, "OC: Log not found");
        return transplantLogs[_logId];
    }

    // --- Additional Getters for new donor profile mappings (optional but useful) ---
    function getDonorEthAddress(string calldata _donorDID) external view returns (address) {
        require(isDonorDIDRegistered[_donorDID], "OC: Donor DID not registered");
        return donorDIDToEthAddress[_donorDID];
    }

    function checkDonorDIDRegistered(string calldata _donorDID) external view returns (bool) {
        return isDonorDIDRegistered[_donorDID];
    }
}