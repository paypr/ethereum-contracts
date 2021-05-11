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

import './IConsumableExchange.sol';
import './ConsumableExchangeImpl.sol';

contract ConsumableExchangeFacet is IConsumableExchange {
  function totalConvertibles() external view override returns (uint256) {
    return ConsumableExchangeImpl.totalConvertibles();
  }

  function convertibleAt(uint256 index) external view override returns (IConsumableConversion) {
    return ConsumableExchangeImpl.convertibleAt(index);
  }

  function isConvertible(IConsumableConversion token) external view override returns (bool) {
    return ConsumableExchangeImpl.isConvertible(token);
  }

  function exchangeRateOf(IConsumableConversion token) external view override returns (ExchangeRate memory) {
    return ConsumableExchangeImpl.exchangeRateOf(token);
  }

  function exchangeTo(IConsumableConversion token, uint256 tokenAmount) external override {
    ConsumableExchangeImpl.exchangeTo(token, tokenAmount);
  }

  function exchangeFrom(IConsumableConversion token, uint256 tokenAmount) external override {
    ConsumableExchangeImpl.exchangeFrom(token, tokenAmount);
  }

  function registerToken(uint256 purchasePriceExchangeRate, uint256 intrinsicValueExchangeRate) external override {
    ConsumableExchangeImpl.registerToken(purchasePriceExchangeRate, intrinsicValueExchangeRate);
  }
}
