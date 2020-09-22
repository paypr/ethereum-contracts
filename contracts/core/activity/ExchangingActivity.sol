// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol';
import './Activity.sol';
import '../consumable/ConsumableExchangeInterfaceSupport.sol';
import '../consumable/IConsumableExchange.sol';
import '../consumable/IConvertibleConsumable.sol';
import '../consumable/ConsumableExchange.sol';
import '../consumable/ConsumableConversionMath.sol';

abstract contract ExchangingActivity is Activity {
  using SafeMath for uint256;
  using ConsumableExchangeInterfaceSupport for IConsumableExchange;
  using ConsumableConversionMath for IConsumableExchange;
  using ConsumableConversionMath for uint256;

  IConsumableExchange private _exchange;
  uint256 private _executionProfit;

  function _initializeExchangingActivity(
    ContractInfo memory info,
    IConsumable.ConsumableAmount[] memory amountsToConsume,
    IConsumable.ConsumableAmount[] memory amountsToProvide,
    IConsumableExchange exchange
  ) internal initializer {
    _initializeActivity(info, amountsToConsume, amountsToProvide);

    require(
      exchange.supportsConsumableExchangeInterface(),
      'ExchangingActivity: exchange must be a consumable exchange'
    );

    _exchange = exchange;

    _executionProfit = _calcExecutionProfit(amountsToConsume, amountsToProvide);
  }

  function exchange() external view returns (IConsumableExchange) {
    return _exchange;
  }

  function executionProfit() external view returns (uint256) {
    return _executionProfit;
  }

  function _calcExecutionProfit(
    IConsumable.ConsumableAmount[] memory amountsToConsume,
    IConsumable.ConsumableAmount[] memory amountsToProvide
  ) internal view returns (uint256) {
    uint256 consumedAmount = _exchange.exchangeTokenProvided(amountsToConsume);
    uint256 providedAmount = _exchange.exchangeTokenNeeded(amountsToProvide);

    return consumedAmount.sub(providedAmount, 'ExchangeActivity: Not enough exchange token consumed to be sustainable');
  }

  function _consumeConsumables(address[] memory providers) internal override onlyEnabled {
    super._consumeConsumables(providers);

    // convert consumables
    IConsumable[] memory consumables = this.consumablesRequired();
    for (uint256 consumableIndex = 0; consumableIndex < consumables.length; consumableIndex++) {
      IConvertibleConsumable consumable = IConvertibleConsumable(address(consumables[consumableIndex]));

      uint256 exchangeRate = _exchange.exchangeRateOf(consumable);

      uint256 consumableBalance = consumable.myBalance();

      uint256 amount = consumableBalance.exchangeTokenProvided(exchangeRate).convertibleTokenNeeded(exchangeRate);
      if (amount > 0) {
        ERC20UpgradeSafe token = ERC20UpgradeSafe(address(consumable));
        token.increaseAllowance(address(_exchange), amount);
        _exchange.exchangeFrom(consumable, amount);
      }
    }
  }

  function _provideConsumables(address consumer) internal override onlyEnabled {
    // exchange as needed to provide consumables
    IConsumable[] memory consumables = this.consumablesProvided();
    for (uint256 consumableIndex = 0; consumableIndex < consumables.length; consumableIndex++) {
      IConvertibleConsumable consumable = IConvertibleConsumable(address(consumables[consumableIndex]));

      uint256 amountToProvide = ConsumableProvider(this).amountProvided(consumable);

      uint256 exchangeRate = _exchange.exchangeRateOf(consumable);

      uint256 exchangeAmount = amountToProvide.exchangeTokenNeeded(exchangeRate);

      if (exchangeAmount > 0) {
        _exchange.exchangeTo(consumable, exchangeAmount);

        bool success = consumable.transferFrom(
          address(_exchange),
          address(this),
          exchangeAmount.convertibleTokenProvided(exchangeRate)
        );
        require(success, 'Provider: Consumable failed to transfer');
      }
    }

    super._provideConsumables(consumer);
  }

  uint256[50] private ______gap;
}