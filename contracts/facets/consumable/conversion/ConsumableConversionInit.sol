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

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './ConsumableConversionImpl.sol';
import '../ERC20Impl.sol';
import '../IConsumableHooks.sol';
import '../../transfer/ITransferHooks.sol';
import '../../transfer/TransferImpl.sol';

contract ConsumableConversionInit {
  struct ConversionData {
    IERC20 exchangeToken;
    uint256 intrinsicValueExchangeRate;
    uint256 purchasePriceExchangeRate;
    IConsumableHooks conversionConsumableHooks;
    ITransferHooks conversionTransferHooks;
    bool registerWithExchange;
  }

  function initialize(ConversionData calldata conversionData) external {
    ConsumableConversionImpl.setExchangeToken(conversionData.exchangeToken);
    ConsumableConversionImpl.setExchangeRates(
      conversionData.intrinsicValueExchangeRate,
      conversionData.purchasePriceExchangeRate
    );
    ERC20Impl.addHooks(conversionData.conversionConsumableHooks);
    TransferImpl.addHooks(conversionData.conversionTransferHooks);

    if (conversionData.registerWithExchange) {
      ConsumableConversionImpl.registerWithExchange();
    }
  }

  function setExchangeToken(IERC20 exchangeToken) external {
    ConsumableConversionImpl.setExchangeToken(exchangeToken);
  }

  /**
   * @dev sets the intrinsic value and purchase price exchange rates to the given value
   */
  function setExchangeRate(uint256 exchangeRate) external {
    ConsumableConversionImpl.setExchangeRate(exchangeRate);
  }

  function setExchangeRates(uint256 intrinsicValueExchangeRate, uint256 purchasePriceExchangeRate) external {
    ConsumableConversionImpl.setExchangeRates(intrinsicValueExchangeRate, purchasePriceExchangeRate);
  }
}
