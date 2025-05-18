// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./AccessControlRoles.sol";
import "./interfaces/IImpactLedger.sol";

contract ImpactLedger is IImpactLedger, AccessControlRoles {
    mapping(string => uint256) public donorTotalImpact;
    mapping(string => mapping(OrganChain.OrganType => uint256)) public donorOrganTypeImpact;
    mapping(OrganChain.OrganType => uint256) public overallOrganTypeImpact;

    address public organChainContract;

    modifier onlyOrganChainContract() {
        require(_msgSender() == organChainContract, "ImpactL: Caller not OrganChain");
        _;
    }
    
    constructor() AccessControlRoles() {}

    function setOrganChainContract(address _address) external onlyAdminRole {
        require(_address != address(0), "ImpactL: Invalid OC address");
        organChainContract = _address;
    }

    function recordSuccessfulTransplant(
        string calldata _donorDID,
        string calldata _recipientDID,
        OrganChain.OrganType _organType
    ) external override onlyOrganChainContract {
        donorTotalImpact[_donorDID]++;
        donorOrganTypeImpact[_donorDID][_organType]++;
        overallOrganTypeImpact[_organType]++;

        emit TransplantImpactRecorded(_donorDID, _recipientDID, _organType, block.timestamp);
    }

    function getDonorImpactCount(string calldata _donorDID) external view override returns (uint256) {
        return donorTotalImpact[_donorDID];
    }

    function getRecipientCountForDonorOrgan(string calldata _donorDID, OrganChain.OrganType _organType) external view override returns (uint256) {
        return donorOrganTypeImpact[_donorDID][_organType];
    }

    function getOverallImpactByOrganType(OrganChain.OrganType _organType) external view returns (uint256) {
        return overallOrganTypeImpact[_organType];
    }
}