// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol';
import './IConvertibleConsumable.sol';
import './ConvertibleConsumableInterfaceSupport.sol';
import './IConsumableExchange.sol';

library ConsumableConversionMath {
  using SafeMath for uint256;
  using ConvertibleConsumableInterfaceSupport for IConvertibleConsumable;

  function exchangeTokenNeeded(IConsumable.ConsumableAmount memory consumableAmount) internal view returns (uint256) {
    IConvertibleConsumable consumable = IConvertibleConsumable(address(consumableAmount.consumable));
    require(
      consumable.supportsConvertibleConsumableInterface(),
      'ConsumableConversionMath: consumable not convertible'
    );

    uint256 exchangeRate = consumable.exchangeRate();
    return exchangeTokenNeeded(consumableAmount.amount, exchangeRate);
  }

  function exchangeTokenProvided(IConsumable.ConsumableAmount memory consumableAmount) internal view returns (uint256) {
    IConvertibleConsumable consumable = IConvertibleConsumable(address(consumableAmount.consumable));
    require(
      consumable.supportsConvertibleConsumableInterface(),
      'ConsumableConversionMath: consumable not convertible'
    );

    uint256 exchangeRate = consumable.exchangeRate();
    return exchangeTokenProvided(consumableAmount.amount, exchangeRate);
  }

  function exchangeTokenNeeded(uint256 amount, uint256 exchangeRate) internal pure returns (uint256) {
    return _toExchangeToken(amount, exchangeRate, true);
  }

  function exchangeTokenProvided(uint256 amount, uint256 exchangeRate) internal pure returns (uint256) {
    return _toExchangeToken(amount, exchangeRate, false);
  }

  function _toExchangeToken(
    uint256 amount,
    uint256 exchangeRate,
    bool roundUp
  ) private pure returns (uint256) {
    uint256 amountExchangeToken = amount.div(exchangeRate);
    if (roundUp && amount.mod(exchangeRate) != 0) {
      amountExchangeToken += 1;
    }
    return amountExchangeToken;
  }

  function convertibleTokenNeeded(uint256 amount, uint256 exchangeRate) internal pure returns (uint256) {
    return _fromExchangeToken(amount, exchangeRate);
  }

  function convertibleTokenProvided(uint256 amount, uint256 exchangeRate) internal pure returns (uint256) {
    return _fromExchangeToken(amount, exchangeRate);
  }

  function _fromExchangeToken(uint256 amount, uint256 exchangeRate) private pure returns (uint256) {
    return amount.mul(exchangeRate);
  }

  function exchangeTokenNeeded(IConsumableExchange exchange, IConsumable.ConsumableAmount[] memory consumableAmounts)
    internal
    view
    returns (uint256)
  {
    return _toExchangeToken(exchange, consumableAmounts, true);
  }

  function exchangeTokenProvided(IConsumableExchange exchange, IConsumable.ConsumableAmount[] memory consumableAmounts)
    internal
    view
    returns (uint256)
  {
    return _toExchangeToken(exchange, consumableAmounts, false);
  }

  function _toExchangeToken(
    IConsumableExchange exchange,
    IConsumable.ConsumableAmount[] memory consumableAmounts,
    bool roundUp
  ) private view returns (uint256) {
    uint256 totalAmount = 0;

    for (uint256 consumableIndex = 0; consumableIndex < consumableAmounts.length; consumableIndex++) {
      IConsumable.ConsumableAmount memory consumableAmount = consumableAmounts[consumableIndex];
      IConsumable consumable = consumableAmount.consumable;
      IConvertibleConsumable convertibleConsumable = IConvertibleConsumable(address(consumable));
      uint256 amount = consumableAmount.amount;

      require(
        exchange.isConvertible(convertibleConsumable),
        'ConsumableConversionMath: Consumable must be convertible by exchange'
      );

      uint256 exchangeRate = exchange.exchangeRateOf(convertibleConsumable);
      uint256 exchangeAmount = _toExchangeToken(amount, exchangeRate, roundUp);

      totalAmount = totalAmount.add(exchangeAmount);
    }

    return totalAmount;
  }
}
