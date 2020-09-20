// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol';
import './ConsumableInterfaceSupport.sol';
import './IConsumable.sol';
import './IConsumableConsumer.sol';

contract ConsumableConsumer is IConsumableConsumer {
  using SafeMath for uint256;
  using ConsumableInterfaceSupport for IConsumable;

  mapping(address => uint256) private _amountsToConsume;
  IConsumable[] private _consumablesToConsume;

  function _initializeConsumableConsumer(IConsumable.ConsumableAmount[] memory amountsToConsume) internal {
    for (uint256 consumableIndex = 0; consumableIndex < amountsToConsume.length; consumableIndex++) {
      IConsumable.ConsumableAmount memory amountToConsume = amountsToConsume[consumableIndex];
      IConsumable consumable = amountToConsume.consumable;
      require(consumable.supportsConsumableInterface(), 'Consumer: Consumable must support interface');

      _amountsToConsume[address(consumable)] = amountToConsume.amount;
      _consumablesToConsume.push(consumable);
    }
  }

  function consumablesRequired() external override view returns (IConsumable[] memory) {
    return _consumablesToConsume;
  }

  function isRequired(IConsumable consumable) external override view returns (bool) {
    return _amountsToConsume[address(consumable)] > 0;
  }

  function amountRequired(IConsumable consumable) external override view returns (uint256) {
    return _amountsToConsume[address(consumable)];
  }

  function _consumeConsumables(address[] memory providers) internal virtual {
    for (uint256 consumableIndex = 0; consumableIndex < _consumablesToConsume.length; consumableIndex++) {
      IConsumable consumable = _consumablesToConsume[consumableIndex];

      uint256 amount = _amountsToConsume[address(consumable)];

      for (uint256 providerIndex; providerIndex < providers.length; providerIndex++) {
        address provider = providers[providerIndex];

        uint256 amountToConsume = consumable.allowance(provider, address(this));

        bool success = consumable.transferFrom(provider, address(this), amountToConsume);
        require(success, 'Consumer: Consumable failed to transfer');

        if (amount > amountToConsume) {
          amount = amount.sub(amountToConsume);
        } else {
          amount = 0;
        }
      }

      require(amount == 0, 'Consumer: Not enough consumable to transfer');
    }
  }

  uint256[50] private ______gap;
}
