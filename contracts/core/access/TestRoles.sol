// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import './ConfigurableRoles.sol';

contract TestRoles is ConfigurableRoles {
  function initializeTestRoles(IRoleDelegate roleDelegate) public initializer {
    initializeRoles(roleDelegate);
  }

  function forSuperAdmin() public view onlySuperAdmin {}

  function forAdmin() public view onlyAdmin {}

  function forMinter() public view onlyMinter {}

  function forTransferAgent() public view onlyTransferAgent {}
}
