/*
 * Copyright (c) 2020 The Paypr Company, LLC
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

pragma solidity ^0.8.3;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import './Consumable.sol';
import './ConsumableExchangeInterfaceSupport.sol';
import './IConsumableExchange.sol';
import './IConvertibleConsumable.sol';
import './ConsumableConversionMath.sol';

abstract contract ConsumableExchange is IConsumableExchange, Consumable {
  using EnumerableSetUpgradeable for EnumerableSetUpgradeable.AddressSet;
  using ConsumableConversionMath for uint256;
  using SafeMathUpgradeable for uint256;

  // amount that 1 of this consumable will convert into the associated token
  // eg if exchange rate is 1000, then 1 this consumable == 1000 associated tokens
  mapping(address => ExchangeRate) private _exchangeRates;
  EnumerableSetUpgradeable.AddressSet private _convertibles;

  function _initializeConsumableExchange(ContractInfo memory info, string memory symbol) internal initializer {
    _initializeConsumable(info, symbol);
    _registerInterface(ConsumableExchangeInterfaceSupport.CONSUMABLE_EXCHANGE_INTERFACE_ID);
  }

  function totalConvertibles() external view override returns (uint256) {
    return _convertibles.length();
  }

  function convertibleAt(uint256 index) external view override returns (IConvertibleConsumable) {
    return IConvertibleConsumable(_convertibles.at(index));
  }

  function isConvertible(IConvertibleConsumable token) external view override returns (bool) {
    return _exchangeRates[address(token)].purchasePrice > 0;
  }

  function exchangeRateOf(IConvertibleConsumable token) external view override returns (ExchangeRate memory) {
    return _exchangeRates[address(token)];
  }

  function exchangeTo(IConvertibleConsumable token, uint256 tokenAmount) external override {
    _exchangeTo(_msgSender(), token, tokenAmount);
  }

  function _exchangeTo(
    address account,
    IConvertibleConsumable consumable,
    uint256 amount
  ) internal onlyEnabled {
    ExchangeRate memory exchangeRate = _exchangeRates[address(consumable)];

    require(exchangeRate.purchasePrice != 0, 'ConsumableExchange: consumable is not convertible');

    uint256 tokenAmount = amount.convertibleTokenProvided(exchangeRate.purchasePrice);

    _transfer(account, address(this), amount);
    this.increaseAllowance(address(consumable), amount);

    consumable.mintByExchange(tokenAmount);

    ERC20Upgradeable token = ERC20Upgradeable(address(consumable));
    token.increaseAllowance(account, tokenAmount);
  }

  function exchangeFrom(IConvertibleConsumable token, uint256 tokenAmount) external override {
    _exchangeFrom(_msgSender(), token, tokenAmount);
  }

  function _exchangeFrom(
    address account,
    IConvertibleConsumable token,
    uint256 tokenAmount
  ) internal onlyEnabled {
    ExchangeRate memory exchangeRate = _exchangeRates[address(token)];

    require(exchangeRate.intrinsicValue != 0, 'ConsumableExchange: token is not convertible');

    token.transferFrom(account, address(this), tokenAmount);

    token.burnByExchange(tokenAmount);

    uint256 myAmount = tokenAmount.exchangeTokenProvided(exchangeRate.intrinsicValue);
    this.transferFrom(address(token), address(this), myAmount);

    _transfer(address(this), account, myAmount);
  }

  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  ) internal virtual override onlyEnabled {
    super._transfer(sender, recipient, amount);

    // check to ensure there is enough of this token left over to exchange if the sender is registered
    ExchangeRate memory senderExchangeRate = _exchangeRates[sender];
    if (senderExchangeRate.intrinsicValue != 0) {
      uint256 senderBalance = balanceOf(sender);
      uint256 tokenAmountAllowed = senderBalance.convertibleTokenProvided(senderExchangeRate.intrinsicValue);

      IERC20Upgradeable token = IERC20Upgradeable(sender);
      require(token.totalSupply() <= tokenAmountAllowed, 'ConsumableExchange: not enough left to cover exchange');
    }
  }

  function registerToken(uint256 purchasePriceExchangeRate, uint256 intrinsicValueExchangeRate) external override {
    IConvertibleConsumable token = IConvertibleConsumable(_msgSender());
    require(purchasePriceExchangeRate > 0, 'ConsumableExchange: must register with a purchase price exchange rate');
    require(intrinsicValueExchangeRate > 0, 'ConsumableExchange: must register with an intrinsic value exchange rate');
    require(
      _exchangeRates[address(token)].purchasePrice == 0,
      'ConsumableExchange: cannot register already registered token'
    );

    _updateExchangeRate(
      token,
      ExchangeRate({ purchasePrice: purchasePriceExchangeRate, intrinsicValue: intrinsicValueExchangeRate })
    );
  }

  function _updateExchangeRate(IConvertibleConsumable token, ExchangeRate memory exchangeRate) internal onlyEnabled {
    require(token != IConvertibleConsumable(address(0)), 'ConsumableExchange: updateExchangeRate for the zero address');

    if (exchangeRate.purchasePrice != 0 && exchangeRate.intrinsicValue != 0) {
      _convertibles.add(address(token));
    } else {
      _convertibles.remove(address(token));
    }

    _exchangeRates[address(token)] = exchangeRate;
    emit ExchangeRateChanged(token, exchangeRate.purchasePrice, exchangeRate.intrinsicValue);
  }

  uint256[50] private ______gap;
}
