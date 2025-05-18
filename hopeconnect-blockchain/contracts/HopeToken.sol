// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title HopeToken
 * @dev Custom ERC20 token for incentivizing organ donors through controlled minting, burning, and transfer restrictions.
 */
contract HopeToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    constructor(address initialAdmin) ERC20("Hope Token", "HOPE") {
        _setupRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _setupRole(MINTER_ROLE, initialAdmin);
        _setupRole(BURNER_ROLE, initialAdmin);
    }

    /**
     * @dev Mint tokens to a donor upon registration and successful health evaluation.
     * Can only be called by accounts with MINTER_ROLE.
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @dev Burn tokens when redeemed for benefits (e.g., tax credits).
     * Can only be called by accounts with BURNER_ROLE.
     */
    function burnForRedemption(address from, uint256 amount) public onlyRole(BURNER_ROLE) {
        _burn(from, amount);
    }

    /**
     * @dev Restrict transfers: Only admin can transfer tokens between accounts. Burns allowed if sender is BURNER or self.
     */
    function _transfer(address from, address to, uint256 amount) internal override {
        if (to == address(0)) {  // burn
            require(hasRole(BURNER_ROLE, _msgSender()) || from == _msgSender(), "HopeToken: Unauthorized burn");
        } else {
            require(hasRole(DEFAULT_ADMIN_ROLE, _msgSender()), "HopeToken: Transfers restricted");
        }
        super._transfer(from, to, amount);
    }

    // Admin functions to manage roles
    function addMinter(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MINTER_ROLE, account);
    }

    function removeMinter(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, account);
    }

    function addBurner(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(BURNER_ROLE, account);
    }

    function removeBurner(address account) public onlyRole(DEFAULT_ADMIN_ROLE) {
        revokeRole(BURNER_ROLE, account);
    }
}
