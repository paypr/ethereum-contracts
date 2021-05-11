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

import '../../context/ContextSupport.sol';
import '../../disableable/DisableableSupport.sol';
import './IConsumableConversion.sol';
import './ConsumableConversionImpl.sol';

contract ConsumableConversionFacet is IConsumableConversion {
  function exchangeToken() external view override returns (IERC20) {
    return ConsumableConversionImpl.exchangeToken();
  }

  function asymmetricalExchangeRate() external view override returns (bool) {
    return ConsumableConversionImpl.asymmetricalExchangeRate();
  }

  function intrinsicValueExchangeRate() external view override returns (uint256) {
    return ConsumableConversionImpl.intrinsicValueExchangeRate();
  }

  function purchasePriceExchangeRate() external view override returns (uint256) {
    return ConsumableConversionImpl.purchasePriceExchangeRate();
  }

  function amountExchangeTokenAvailable() external view override returns (uint256) {
    return ConsumableConversionImpl.amountExchangeTokenAvailable();
  }

  function mintByExchange(uint256 consumableAmount) external override {
    DisableableSupport.checkEnabled();

    ConsumableConversionImpl.mintByExchange(ContextSupport.msgSender(), consumableAmount);
  }

  function amountExchangeTokenNeeded(uint256 consumableAmount) external view override returns (uint256) {
    return ConsumableConversionImpl.amountExchangeTokenNeeded(consumableAmount);
  }

  function burnByExchange(uint256 consumableAmount) external override {
    DisableableSupport.checkEnabled();

    ConsumableConversionImpl.burnByExchange(ContextSupport.msgSender(), consumableAmount);
  }

  function amountExchangeTokenProvided(uint256 consumableAmount) external view override returns (uint256) {
    return ConsumableConversionImpl.amountExchangeTokenProvided(consumableAmount);
  }
}
