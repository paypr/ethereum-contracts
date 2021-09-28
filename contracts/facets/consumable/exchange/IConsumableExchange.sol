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

import '../conversion/IConsumableConversion.sol';

interface IConsumableExchange {
  struct ExchangeRate {
    uint256 purchasePrice;
    uint256 intrinsicValue;
  }

  /**
   * @notice Returns the total number of convertibles registered as part of this exchange.
   */
  function totalConvertibles() external view returns (uint256);

  /**
   * @notice Returns the convertible with the given index. Reverts if index is higher than totalConvertibles.
   */
  function convertibleAt(uint256 index) external view returns (IConsumableConversion);

  /**
   * @notice Returns whether or not the token at the given address is convertible with this exchange.
   */
  function isConvertible(IConsumableConversion token) external view returns (bool);

  /**
   * @notice Returns exchange rate of the given token
   *
   * eg if exchange rate is 1000, then 1 this consumable == 1000 associated tokens
   */
  function exchangeRateOf(IConsumableConversion token) external view returns (ExchangeRate memory);

  /**
   * @notice Exchanges the given amount of this consumable to the given token for the sender
   *
   * The sender must have enough of this consumable to make the exchange.
   *
   * When complete, the sender should transfer the new tokens into their account.
   */
  function exchangeTo(IConsumableConversion tokenAddress, uint256 amount) external;

  /**
   * @notice Exchanges the given amount of the given token to this consumable for the sender
   *
   * Before calling, the sender must provide allowance of the given token for the appropriate amount.this
   *
   * When complete, the sender will have the correct amount of this consumable.
   */
  function exchangeFrom(IConsumableConversion token, uint256 tokenAmount) external;

  /**
   * @notice Registers a token with this exchange, using the given `purchasePriceExchangeRate` and `intrinsicValueExchangeRate`.
   *
   * NOTE: Can only be called when the token has no current exchange rate
   */
  function registerToken(uint256 purchasePriceExchangeRate, uint256 intrinsicValueExchangeRate) external;

  /**
   * @notice Emitted when the exchange rate changes for `token`.
   * `purchasePriceExchangeRate` is the new purchase price exchange rate
   * `intrinsicValueExchangeRate` is the new intrinsic value exchange rate
   */
  event ExchangeRateChanged(
    IConsumableConversion indexed token,
    uint256 indexed purchasePriceExchangeRate,
    uint256 indexed intrinsicValueExchangeRate
  );
}
