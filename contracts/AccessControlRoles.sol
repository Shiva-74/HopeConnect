// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract AccessControlRoles is Context, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant HOSPITAL_ROLE = keccak256("HOSPITAL_ROLE");
    bytes32 public constant REGULATOR_ROLE = keccak256("REGULATOR_ROLE");
    bytes32 public constant DONOR_AUTH_ROLE = keccak256("DONOR_AUTH_ROLE");
    bytes32 public constant LOGISTICS_ROLE = keccak256("LOGISTICS_ROLE");
    bytes32 public constant DID_REGISTRAR_ROLE = keccak256("DID_REGISTRAR_ROLE");

    address public contractOwner;

    constructor() {
        contractOwner = _msgSender();
        _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _grantRole(ADMIN_ROLE, _msgSender());
    }

    modifier onlyOwner() {
        require(_msgSender() == contractOwner, "Caller is not the contract owner");
        _;
    }

    function addAdmin(address _account) public virtual onlyAdminRole {
        grantRole(ADMIN_ROLE, _account);
    }
    function removeAdmin(address _account) public virtual onlyAdminRole {
        revokeRole(ADMIN_ROLE, _account);
    }
    function addHospital(address _account) public virtual onlyAdminRole {
        grantRole(HOSPITAL_ROLE, _account);
    }
    function removeHospital(address _account) public virtual onlyAdminRole {
        revokeRole(HOSPITAL_ROLE, _account);
    }
    function addRegulator(address _account) public virtual onlyAdminRole {
        grantRole(REGULATOR_ROLE, _account);
    }
    function removeRegulator(address _account) public virtual onlyAdminRole {
        revokeRole(REGULATOR_ROLE, _account);
    }
    function addDonorAuth(address _account) public virtual onlyAdminRole {
        grantRole(DONOR_AUTH_ROLE, _account);
    }
    function removeDonorAuth(address _account) public virtual onlyAdminRole {
        revokeRole(DONOR_AUTH_ROLE, _account);
    }
    function addLogisticsPartner(address _account) public virtual onlyAdminRole {
        grantRole(LOGISTICS_ROLE, _account);
    }
    function removeLogisticsPartner(address _account) public virtual onlyAdminRole {
        revokeRole(LOGISTICS_ROLE, _account);
    }
    function addDidRegistrar(address _account) public virtual onlyAdminRole {
        grantRole(DID_REGISTRAR_ROLE, _account);
    }
    function removeDidRegistrar(address _account) public virtual onlyAdminRole {
        revokeRole(DID_REGISTRAR_ROLE, _account);
    }
    
    modifier onlyAdminRole() {
        require(hasRole(ADMIN_ROLE, _msgSender()), "Caller is not an admin");
        _;
    }
    modifier onlyHospitalRole() {
        require(hasRole(HOSPITAL_ROLE, _msgSender()), "Caller is not an authorized hospital");
        _;
    }
    modifier onlyRegulatorRole() {
        require(hasRole(REGULATOR_ROLE, _msgSender()), "Caller is not an authorized regulator");
        _;
    }
    modifier onlyDonorAuthRole() {
        require(hasRole(DONOR_AUTH_ROLE, _msgSender()), "Caller is not an authorized donor registration entity");
        _;
    }
    modifier onlyLogisticsRole() {
        require(hasRole(LOGISTICS_ROLE, _msgSender()), "Caller is not an authorized logistics partner");
        _;
    }
    modifier onlyDidRegistrarRole() {
        require(hasRole(DID_REGISTRAR_ROLE, _msgSender()), "Caller is not a DID registrar");
        _;
    }
}