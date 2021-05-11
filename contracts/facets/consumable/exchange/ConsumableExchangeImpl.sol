/*
 * Copyright (c) 2021 The Paypr Company, LLC
 *
 * This file is part of Paypr Ethereum Contracts.
 *
 * Paypr Ethereum Contracts is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Paypr Ethereum Contracts is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Paypr Ethereum Contracts.  If not, see <https://www.gnu.org/licenses/>.
 */

// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.4;

import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import '../../context/ContextSupport.sol';
import '../ERC20Impl.sol';
import '../conversion/ConsumableConversionMath.sol';
import '../conversion/IConsumableConversion.sol';
import './IConsumableExchange.sol';

library ConsumableExchangeImpl {
  using EnumerableSet for EnumerableSet.AddressSet;
  using ConsumableConversionMath for uint256;
  using SafeMath for uint256;

  bytes32 private constant CONSUMABLE_EXCHANGE_STORAGE_POSITION = keccak256('paypr.consumableExchange.storage');

  struct ConsumableExchangeStorage {
    // amount that 1 of the consumable implemented by the exchange will convert into the base token
    // eg if exchange rate is 1000, then 1 this consumable == 1000 associated tokens
    mapping(address => IConsumableExchange.ExchangeRate) exchangeRates;
    EnumerableSet.AddressSet convertibles;
  }

  //noinspection NoReturn
  function _consumableExchangeStorage() private pure returns (ConsumableExchangeStorage storage ds) {
    bytes32 position = CONSUMABLE_EXCHANGE_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function totalConvertibles() internal view returns (uint256) {
    return _consumableExchangeStorage().convertibles.length();
  }

  function convertibleAt(uint256 index) internal view returns (IConsumableConversion) {
    return IConsumableConversion(_consumableExchangeStorage().convertibles.at(index));
  }

  function isConvertible(IConsumableConversion token) internal view returns (bool) {
    return _consumableExchangeStorage().exchangeRates[address(token)].purchasePrice > 0;
  }

  function exchangeRateOf(IConsumableConversion token) internal view returns (IConsumableExchange.ExchangeRate memory) {
    return _consumableExchangeStorage().exchangeRates[address(token)];
  }

  function exchangeTo(IConsumableConversion token, uint256 tokenAmount) internal {
    _exchangeTo(ContextSupport.msgSender(), token, tokenAmount);
  }

  function _exchangeTo(
    address account,
    IConsumableConversion consumable,
    uint256 amount
  ) internal {
    IConsumableExchange.ExchangeRate memory exchangeRate = exchangeRateOf(consumable);

    require(exchangeRate.purchasePrice != 0, 'ConsumableExchange: consumable is not convertible');

    uint256 tokenAmount = amount.convertibleTokenProvided(exchangeRate.purchasePrice);

    ERC20Impl._transfer(account, address(this), amount);
    IConsumable(address(this)).increaseAllowance(address(consumable), amount);

    consumable.mintByExchange(tokenAmount);

    IConsumable token = IConsumable(address(consumable));
    token.increaseAllowance(account, tokenAmount);
  }

  function exchangeFrom(IConsumableConversion token, uint256 tokenAmount) internal {
    _exchangeFrom(ContextSupport.msgSender(), token, tokenAmount);
  }

  function _exchangeFrom(
    address account,
    IConsumableConversion token,
    uint256 tokenAmount
  ) internal {
    IConsumableExchange.ExchangeRate memory exchangeRate = exchangeRateOf(token);

    require(exchangeRate.intrinsicValue != 0, 'ConsumableExchange: token is not convertible');

    IConsumable(address(token)).transferFrom(account, address(this), tokenAmount);

    token.burnByExchange(tokenAmount);

    uint256 myAmount = tokenAmount.exchangeTokenProvided(exchangeRate.intrinsicValue);
    IConsumable(address(this)).transferFrom(address(token), address(this), myAmount);

    ERC20Impl._transfer(address(this), account, myAmount);
  }

  function checkEnoughTokenLeft(address sender) internal view {
    // check to ensure there is enough of this token left over to exchange if the sender is registered
    IConsumableExchange.ExchangeRate memory senderExchangeRate = exchangeRateOf(IConsumableConversion(sender));
    if (senderExchangeRate.intrinsicValue != 0) {
      uint256 senderBalance = IConsumable(address(this)).balanceOf(sender);
      uint256 tokenAmountAllowed = senderBalance.convertibleTokenProvided(senderExchangeRate.intrinsicValue);

      IERC20 token = IERC20(sender);
      require(token.totalSupply() <= tokenAmountAllowed, 'ConsumableExchange: not enough left to cover exchange');
    }
  }

  function registerToken(uint256 purchasePriceExchangeRate, uint256 intrinsicValueExchangeRate) internal {
    IConsumableConversion token = IConsumableConversion(ContextSupport.msgSender());
    require(purchasePriceExchangeRate > 0, 'ConsumableExchange: must register with a purchase price exchange rate');
    require(intrinsicValueExchangeRate > 0, 'ConsumableExchange: must register with an intrinsic value exchange rate');
    require(exchangeRateOf(token).purchasePrice == 0, 'ConsumableExchange: cannot register already registered token');

    _updateExchangeRate(
      token,
      IConsumableExchange.ExchangeRate({
        purchasePrice: purchasePriceExchangeRate,
        intrinsicValue: intrinsicValueExchangeRate
      })
    );
  }

  function _updateExchangeRate(IConsumableConversion token, IConsumableExchange.ExchangeRate memory exchangeRate)
    internal
  {
    require(token != IConsumableConversion(address(0)), 'ConsumableExchange: updateExchangeRate for the zero address');

    ConsumableExchangeStorage storage exchangeStorage = _consumableExchangeStorage();

    if (exchangeRate.purchasePrice != 0 && exchangeRate.intrinsicValue != 0) {
      exchangeStorage.convertibles.add(address(token));
    } else {
      exchangeStorage.convertibles.remove(address(token));
    }

    exchangeStorage.exchangeRates[address(token)] = exchangeRate;
    emit ExchangeRateChanged(token, exchangeRate.purchasePrice, exchangeRate.intrinsicValue);
  }

  // have to redeclare here even though they are already declared in IConsumableExchange
  event ExchangeRateChanged(
    IConsumableConversion indexed token,
    uint256 indexed purchasePriceExchangeRate,
    uint256 indexed intrinsicValueExchangeRate
  );
}
