/*
 * Copyright (c) 2020 The Paypr Company
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

pragma solidity ^0.6.0;

import './IConsumable.sol';

interface IConvertibleConsumable is IConsumable {
  /**
   * @dev the token that can be exchanged to/from
   */
  function exchangeToken() external view returns (IERC20);

  /**
   * @dev whether or not this consumable has a different purchase price than intrinsic value
   */
  function asymmetricalExchangeRate() external view returns (bool);

  /**
   * @dev the amount of this consumable needed to convert to 1 of `exchangeToken`
   *
   * eg if `intrinsicValueExchangeRate` is 1000, then 1000 this --> 1 `conversionToken`
   */
  function intrinsicValueExchangeRate() external view returns (uint256);

  /**
   * @dev the amount that 1 of `exchangeToken` will convert into this consumable
   *
   * eg if `purchasePriceExchangeRate` is 1000, then 1 `conversionToken` --> 1000 this
   */
  function purchasePriceExchangeRate() external view returns (uint256);

  /**
   * @dev amount of exchange token available, given total supply
   */
  function amountExchangeTokenAvailable() external view returns (uint256);

  /**
   * @dev mint `consumableAmount` tokens by converting from `exchangeToken`
   */
  function mintByExchange(uint256 consumableAmount) external;

  /**
   * @dev amount of exchange token needed to mint the given amount of consumable
   */
  function amountExchangeTokenNeeded(uint256 consumableAmount) external view returns (uint256);

  /**
   * @dev burn `consumableAmount` tokens by converting to `exchangeToken`
   */
  function burnByExchange(uint256 consumableAmount) external;

  /**
   * @dev amount of exchange token provided by burning the given amount of consumable
   */
  function amountExchangeTokenProvided(uint256 consumableAmount) external view returns (uint256);
}
