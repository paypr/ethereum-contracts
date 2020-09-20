// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165.sol';
import './DelegatingRoles.sol';

contract TestDelegatingRoles is DelegatingRoles {
  function initializeTestDelegatingRoles(IRoleDelegate roleDelegate) public initializer {
    _addRoleDelegate(roleDelegate);
  }

  function forAdmin() public view onlyAdmin {}

  function forMinter() public view onlyMinter {}

  function forTransferAgent() public view onlyTransferAgent {}
}
