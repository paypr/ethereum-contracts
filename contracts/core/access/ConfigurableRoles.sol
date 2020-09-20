// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165.sol';
import './Roles.sol';
import './RoleDelegateInterfaceSupport.sol';

contract ConfigurableRoles is Roles, ERC165UpgradeSafe {
  function initializeRoles(IRoleDelegate roleDelegate) public initializer {
    __ERC165_init();
    _registerInterface(RoleDelegateInterfaceSupport.ROLE_DELEGATE_INTERFACE_ID);

    _initializeRoles(roleDelegate);
  }

  /**
   * @dev Adds the given role delegate
   */
  function addRoleDelegate(IRoleDelegate roleDelegate) public onlySuperAdmin {
    _addRoleDelegate(roleDelegate);
  }

  /**
   * @dev Removes the given role delegate
   */
  function removeRoleDelegate(IRoleDelegate roleDelegate) public onlySuperAdmin {
    _removeRoleDelegate(roleDelegate);
  }
}
