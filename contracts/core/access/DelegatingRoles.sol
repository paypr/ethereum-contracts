// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/utils/EnumerableSet.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/GSN/Context.sol';
import './IRoleDelegate.sol';
import './RoleDelegateInterfaceSupport.sol';
import './RoleSupport.sol';

contract DelegatingRoles is ContextUpgradeSafe {
  using EnumerableSet for EnumerableSet.AddressSet;
  using RoleDelegateInterfaceSupport for IRoleDelegate;

  EnumerableSet.AddressSet private _roleDelegates;

  function isRoleDelegate(IRoleDelegate roleDelegate) public view returns (bool) {
    return _roleDelegates.contains(address(roleDelegate));
  }

  /**
   * @dev Adds the given role delegate
   */
  function _addRoleDelegate(IRoleDelegate roleDelegate) internal {
    require(address(roleDelegate) != address(0), 'Role delegate cannot be zero address');
    require(roleDelegate.supportsRoleDelegateInterface(), 'Role delegate must implement interface');

    _roleDelegates.add(address(roleDelegate));
    emit RoleDelegateAdded(roleDelegate);
  }

  /**
   * @dev Removes the given role delegate
   */
  function _removeRoleDelegate(IRoleDelegate roleDelegate) internal {
    _roleDelegates.remove(address(roleDelegate));
    emit RoleDelegateRemoved(roleDelegate);
  }

  /**
   * @dev Returns `true` if `account` has been granted `role`.
   */
  function _hasRole(bytes32 role, address account) internal virtual view returns (bool) {
    uint256 roleDelegateLength = _roleDelegates.length();
    for (uint256 roleDelegateIndex = 0; roleDelegateIndex < roleDelegateLength; roleDelegateIndex++) {
      IRoleDelegate roleDelegate = IRoleDelegate(_roleDelegates.at(roleDelegateIndex));
      if (roleDelegate.isInRole(role, account)) {
        return true;
      }
    }

    return false;
  }

  // Admin
  modifier onlyAdmin() {
    require(isAdmin(_msgSender()), 'Caller does not have the Admin role');
    _;
  }

  function isAdmin(address account) public view returns (bool) {
    return _hasRole(RoleSupport.ADMIN_ROLE, account);
  }

  // Minter
  modifier onlyMinter() {
    require(isMinter(_msgSender()), 'Caller does not have the Minter role');
    _;
  }

  function isMinter(address account) public view returns (bool) {
    return _hasRole(RoleSupport.MINTER_ROLE, account);
  }

  // Transfer Agent
  modifier onlyTransferAgent() {
    require(isTransferAgent(_msgSender()), 'Caller does not have the Transfer Agent role');
    _;
  }

  function isTransferAgent(address account) public view returns (bool) {
    return _hasRole(RoleSupport.TRANSFER_AGENT_ROLE, account);
  }

  /**
   * @dev Emitted when `roleDelegated` is added.
   */
  event RoleDelegateAdded(IRoleDelegate indexed roleDelegate);

  /**
   * @dev Emitted when `roleDelegated` is removed.
   */
  event RoleDelegateRemoved(IRoleDelegate indexed roleDelegate);

  uint256[50] private ______gap;
}
