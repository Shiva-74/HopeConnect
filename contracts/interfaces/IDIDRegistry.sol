// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IDIDRegistry {
    enum IdentityType { Donor, Hospital, Regulator, NGO, Other }

    struct IdentityRecord {
        string did;
        address ownerAddress;
        IdentityType idType;
        bytes32 credentialsHash;
        bool isValid;
        uint256 registrationTimestamp;
    }

    event DIDRegistered(string indexed did, address indexed ownerAddress, IdentityType idType, uint256 timestamp);
    event DIDRevoked(string indexed did, uint256 timestamp);

    function registerDID(string calldata did, address ownerAddress, IdentityType idType, bytes32 credentialsHash) external returns (bool);
    function revokeDID(string calldata did) external returns (bool);
    function getDIDRecord(string calldata did) external view returns (IdentityRecord memory);
    function isDIDValid(string calldata did) external view returns (bool);
    function getDIDByOwner(address _ownerAddress) external view returns (string memory);
}