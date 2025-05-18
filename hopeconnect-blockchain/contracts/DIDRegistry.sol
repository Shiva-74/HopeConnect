// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./AccessControlRoles.sol";
import "./interfaces/IDIDRegistry.sol";

contract DIDRegistry is IDIDRegistry, AccessControlRoles {
    mapping(string => IdentityRecord) private didRecords;
    mapping(address => string) private ownerToDID;

    constructor() AccessControlRoles() {}

    function registerDID(
        string calldata _did,
        address _ownerAddress,
        IdentityType _idType,
        bytes32 _credentialsHash
    ) external override onlyDidRegistrarRole returns (bool) {
        require(bytes(didRecords[_did].did).length == 0, "DID: Already registered");
        require(bytes(ownerToDID[_ownerAddress]).length == 0, "DID: Owner already has a DID");
        require(_ownerAddress != address(0), "DID: Invalid owner address");

        didRecords[_did] = IdentityRecord({
            did: _did,
            ownerAddress: _ownerAddress,
            idType: _idType,
            credentialsHash: _credentialsHash,
            isValid: true,
            registrationTimestamp: block.timestamp
        });
        ownerToDID[_ownerAddress] = _did;

        emit DIDRegistered(_did, _ownerAddress, _idType, block.timestamp);
        return true;
    }

    function revokeDID(string calldata _did) external override onlyDidRegistrarRole returns (bool) {
        require(bytes(didRecords[_did].did).length != 0, "DID: Not found");
        require(didRecords[_did].isValid, "DID: Already revoked or invalid");

        didRecords[_did].isValid = false;
        emit DIDRevoked(_did, block.timestamp);
        return true;
    }

    function getDIDRecord(string calldata _did) external view override returns (IdentityRecord memory) {
        require(bytes(didRecords[_did].did).length != 0, "DID: Not found");
        return didRecords[_did];
    }

    function isDIDValid(string calldata _did) external view override returns (bool) {
        return bytes(didRecords[_did].did).length != 0 && didRecords[_did].isValid;
    }

    function getDIDByOwner(address _ownerAddress) external view override returns (string memory) {
        require(bytes(ownerToDID[_ownerAddress]).length > 0, "DID: No DID for owner");
        return ownerToDID[_ownerAddress];
    }
}