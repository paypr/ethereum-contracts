// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165Checker.sol';
import './IRoleDelegate.sol';

library RoleDelegateInterfaceSupport {
  using ERC165Checker for address;

  bytes4 internal constant ROLE_DELEGATE_INTERFACE_ID = 0x7cef57ea;

  function supportsRoleDelegateInterface(IRoleDelegate roleDelegate) internal view returns (bool) {
    return address(roleDelegate).supportsInterface(ROLE_DELEGATE_INTERFACE_ID);
  }
}
