// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './BaseContract.sol';

contract TestBaseContract is BaseContract {
  function initialize(ContractInfo memory info) public initializer {
    _initializeBaseContract(info);
  }
}
