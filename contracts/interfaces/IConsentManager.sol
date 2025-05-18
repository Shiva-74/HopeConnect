// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../OrganChain.sol"; 

interface IConsentManager {
    enum RecipientScope { Local, State, National, International, ResearchOnly, AnyRecipient }
    enum OrganUsage { TransplantOnly, ResearchAndTransplant }

    event ConsentRegistered(string indexed donorDID, uint256 timestamp);
    event ConsentUpdated(string indexed donorDID, uint256 timestamp);

    function registerOrUpdateConsent(
        string calldata donorDID,
        OrganChain.OrganType[] calldata organTypes,
        bool[] calldata donationStatuses,
        RecipientScope[] calldata scopes,
        OrganUsage[] calldata usages
    ) external returns (bool);

    function getConsent(string calldata donorDID, OrganChain.OrganType organType)
        external view returns (bool canDonate, RecipientScope scope, OrganUsage usage);
    
    function checkConsentCompatibility(
        string calldata donorDID,
        OrganChain.OrganType organType,
        RecipientScope requiredScope,
        OrganUsage requiredUsage
    ) external view returns (bool);
}