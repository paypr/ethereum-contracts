// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './ConsumableProvider.sol';

contract TestConsumableProvider is ConsumableProvider {
  function initializeConsumableProvider(IConsumable.ConsumableAmount[] memory amountsToProvide) public {
    _initializeConsumableProvider(amountsToProvide);
  }

  function canProvideMultiple(uint256 howMany) public view returns (bool) {
    return _canProvideMultiple(howMany);
  }

  function provideConsumables(address consumer) public {
    _provideConsumables(consumer);
  }
}
