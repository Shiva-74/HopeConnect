// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./AccessControlRoles.sol";
import "./interfaces/IConsentManager.sol";
import "./interfaces/IDIDRegistry.sol";
import "./OrganChain.sol"; 

contract ConsentManager is IConsentManager, AccessControlRoles {

    struct DonorPreferencesInternal {
        mapping(OrganChain.OrganType => bool) organDonationStatus;
        mapping(OrganChain.OrganType => IConsentManager.RecipientScope) recipientScopes;
        mapping(OrganChain.OrganType => IConsentManager.OrganUsage) organUsages;
        uint256 lastUpdatedTimestamp;
        bool isActive;
        bool initialized;
    }

    mapping(string => DonorPreferencesInternal) public donorConsents;

    IDIDRegistry public didRegistry;

    constructor(address _didRegistryAddress) AccessControlRoles() {
        require(_didRegistryAddress != address(0), "ConsentM: Invalid DIDRegistry");
        didRegistry = IDIDRegistry(_didRegistryAddress);
    }

    function registerOrUpdateConsent(
        string calldata _donorDID,
        OrganChain.OrganType[] calldata _organTypes,
        bool[] calldata _donationStatuses,
        IConsentManager.RecipientScope[] calldata _scopes,
        IConsentManager.OrganUsage[] calldata _usages
    ) external override onlyDonorAuthRole returns (bool) {
        require(didRegistry.isDIDValid(_donorDID), "ConsentM: Invalid donor DID");
        IDIDRegistry.IdentityRecord memory donorRecord = didRegistry.getDIDRecord(_donorDID);
        require(donorRecord.idType == IDIDRegistry.IdentityType.Donor, "ConsentM: DID not Donor type");

        require(_organTypes.length == _donationStatuses.length, "Len mismatch: status");
        require(_organTypes.length == _scopes.length, "Len mismatch: scopes");
        require(_organTypes.length == _usages.length, "Len mismatch: usages");

        DonorPreferencesInternal storage prefs = donorConsents[_donorDID];
        if (!prefs.initialized) {
            prefs.initialized = true;
            prefs.isActive = true;
            emit ConsentRegistered(_donorDID, block.timestamp);
        }

        for (uint i = 0; i < _organTypes.length; i++) {
            prefs.organDonationStatus[_organTypes[i]] = _donationStatuses[i];
            prefs.recipientScopes[_organTypes[i]] = _scopes[i];
            prefs.organUsages[_organTypes[i]] = _usages[i];
        }
        prefs.lastUpdatedTimestamp = block.timestamp;

        emit ConsentUpdated(_donorDID, block.timestamp);
        return true;
    }

    function getConsent(string calldata _donorDID, OrganChain.OrganType _organType)
        external view override
        returns (bool canDonate, IConsentManager.RecipientScope scope, IConsentManager.OrganUsage usage)
    {
        require(donorConsents[_donorDID].initialized, "ConsentM: Not found");
        DonorPreferencesInternal storage prefs = donorConsents[_donorDID];
        require(prefs.isActive, "ConsentM: Not active");

        canDonate = prefs.organDonationStatus[_organType];
        scope = prefs.recipientScopes[_organType];
        usage = prefs.organUsages[_organType];
    }
    
    function checkConsentCompatibility(
        string calldata _donorDID,
        OrganChain.OrganType _organType,
        IConsentManager.RecipientScope _requiredScope,
        IConsentManager.OrganUsage _requiredUsage
    ) public view override returns (bool) {
        require(donorConsents[_donorDID].initialized, "ConsentM: Not found for donor DID");
        DonorPreferencesInternal storage prefs = donorConsents[_donorDID];
        require(prefs.isActive, "ConsentM: Consent is not active");

        if (!prefs.organDonationStatus[_organType]) {
            return false; 
        }

        if (prefs.organUsages[_organType] == IConsentManager.OrganUsage.TransplantOnly && _requiredUsage == IConsentManager.OrganUsage.ResearchAndTransplant) {
            return false;
        }

        IConsentManager.RecipientScope donorScope = prefs.recipientScopes[_organType];
        if (donorScope == IConsentManager.RecipientScope.AnyRecipient) return true;
        if (donorScope == IConsentManager.RecipientScope.International) return true;
        if (donorScope == IConsentManager.RecipientScope.National && 
           (_requiredScope == IConsentManager.RecipientScope.National || _requiredScope == IConsentManager.RecipientScope.State || _requiredScope == IConsentManager.RecipientScope.Local)) return true;
        if (donorScope == IConsentManager.RecipientScope.State && 
           (_requiredScope == IConsentManager.RecipientScope.State || _requiredScope == IConsentManager.RecipientScope.Local)) return true;
        if (donorScope == IConsentManager.RecipientScope.Local && _requiredScope == IConsentManager.RecipientScope.Local) return true;
        if (donorScope == IConsentManager.RecipientScope.ResearchOnly && _requiredScope == IConsentManager.RecipientScope.ResearchOnly) return true;
            
        return false;
    }

    function deactivateConsent(string calldata _donorDID) external onlyAdminRole {
        require(donorConsents[_donorDID].initialized, "ConsentM: Not found");
        donorConsents[_donorDID].isActive = false;
        emit ConsentUpdated(_donorDID, block.timestamp);
    }

    function reactivateConsent(string calldata _donorDID) external onlyAdminRole {
        require(donorConsents[_donorDID].initialized, "ConsentM: Not found");
        donorConsents[_donorDID].isActive = true;
        emit ConsentUpdated(_donorDID, block.timestamp);
    }
}