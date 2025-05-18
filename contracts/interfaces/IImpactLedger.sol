// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "../OrganChain.sol"; 

interface IImpactLedger {
    event TransplantImpactRecorded(string indexed donorDID, string indexed recipientDID, OrganChain.OrganType organType, uint256 timestamp);

    function recordSuccessfulTransplant(string calldata donorDID, string calldata recipientDID, OrganChain.OrganType organType) external;
    function getDonorImpactCount(string calldata donorDID) external view returns (uint256);
    function getRecipientCountForDonorOrgan(string calldata donorDID, OrganChain.OrganType organType) external view returns (uint256);
}