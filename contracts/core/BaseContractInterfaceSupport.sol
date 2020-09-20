// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165Checker.sol';
import './IBaseContract.sol';

library BaseContractInterfaceSupport {
  using ERC165Checker for address;

  bytes4 internal constant BASE_CONTRACT_INTERFACE_ID = 0x321f350b;

  function supportsBaseContractInterface(IBaseContract account) internal view returns (bool) {
    return address(account).supportsInterface(BASE_CONTRACT_INTERFACE_ID);
  }
}
