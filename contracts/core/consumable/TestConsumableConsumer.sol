// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './ConsumableConsumer.sol';

contract TestConsumableConsumer is ConsumableConsumer {
  function initializeConsumableConsumer(IConsumable.ConsumableAmount[] memory amountsToConsume) public {
    _initializeConsumableConsumer(amountsToConsume);
  }

  function consumeConsumables(address[] memory providers) public {
    _consumeConsumables(providers);
  }
}
