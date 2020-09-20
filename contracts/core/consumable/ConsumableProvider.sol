// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol';
import './ConsumableInterfaceSupport.sol';
import './IConsumableProvider.sol';
import './IConsumable.sol';

contract ConsumableProvider is IConsumableProvider {
  using SafeMath for uint256;
  using ConsumableInterfaceSupport for IConsumable;

  mapping(address => uint256) private _amountsToProvide;
  IConsumable[] private _consumablesToProvide;

  function _initializeConsumableProvider(IConsumable.ConsumableAmount[] memory amountsToProvide) internal {
    for (uint256 consumableIndex = 0; consumableIndex < amountsToProvide.length; consumableIndex++) {
      IConsumable.ConsumableAmount memory amountToProvide = amountsToProvide[consumableIndex];
      IConsumable consumable = IConsumable(amountToProvide.consumable);
      require(consumable.supportsConsumableInterface(), 'Provider: Consumable must support interface');

      if (amountToProvide.amount > 0) {
        _amountsToProvide[address(consumable)] = amountToProvide.amount;
        _consumablesToProvide.push(consumable);
      }
    }
  }

  function consumablesProvided() external override view returns (IConsumable[] memory) {
    return _consumablesToProvide;
  }

  function isProvided(IConsumable consumable) external override view returns (bool) {
    return _amountsToProvide[address(consumable)] > 0;
  }

  function amountProvided(IConsumable consumable) external override view returns (uint256) {
    return _amountsToProvide[address(consumable)];
  }

  function _canProvideMultiple(uint256 howMany) internal view returns (bool) {
    if (howMany == 0) {
      return true;
    }

    for (uint256 consumableIndex = 0; consumableIndex < _consumablesToProvide.length; consumableIndex++) {
      IConsumable consumable = _consumablesToProvide[consumableIndex];

      uint256 amountOwned = consumable.balanceOf(address(this));
      uint256 totalAmountToProvide;
      if (howMany > 1) {
        totalAmountToProvide = _amountsToProvide[address(consumable)].mul(howMany);
      } else {
        totalAmountToProvide = _amountsToProvide[address(consumable)];
      }

      if (totalAmountToProvide > amountOwned) {
        return false;
      }
    }

    return true;
  }

  function _provideConsumables(address consumer) internal virtual {
    require(_canProvideMultiple(1), 'Provider: Not enough consumable to provide');

    for (uint256 consumableIndex = 0; consumableIndex < _consumablesToProvide.length; consumableIndex++) {
      IConsumable consumable = _consumablesToProvide[consumableIndex];

      // could fail if not enough resources
      ERC20UpgradeSafe token = ERC20UpgradeSafe(address(consumable));
      bool success = token.increaseAllowance(consumer, _amountsToProvide[address(consumable)]);
      require(success, 'Provider: Consumable failed to transfer');

      // enhance: limit the amount transferred for each consumable based on the activity amount
    }
  }

  uint256[50] private ______gap;
}
