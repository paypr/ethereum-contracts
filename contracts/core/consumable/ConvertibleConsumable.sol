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
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol';
import './Consumable.sol';
import './ConvertibleConsumableInterfaceSupport.sol';
import './IConvertibleConsumable.sol';
import './IConsumableExchange.sol';
import './ConsumableConversionMath.sol';

abstract contract ConvertibleConsumable is IConvertibleConsumable, Consumable {
  using SafeMath for uint256;
  using ConsumableConversionMath for uint256;

  IERC20 private _exchangeToken;

  // amount that 1 of exchangeToken will convert into this consumable
  // eg if purchasePriceExchangeRate is 1000, then 1 exchangeToken will purchase 1000 of this token
  uint256 private _purchasePriceExchangeRate;

  // amount of this token needed to exchange for 1 exchangeToken
  // eg if intrinsicValueExchangeRate is 1000, then 1000 of this is needed to exchange for 1 exchangeToken
  uint256 private _intrinsicValueExchangeRate;

  function _initializeConvertibleConsumable(
    ContractInfo memory info,
    string memory symbol,
    IERC20 exchangeToken,
    uint256 purchasePriceExchangeRate,
    uint256 intrinsicValueExchangeRate,
    bool registerWithExchange
  ) internal initializer {
    _initializeConsumable(info, symbol);
    _registerInterface(ConvertibleConsumableInterfaceSupport.CONVERTIBLE_CONSUMABLE_INTERFACE_ID);

    require(purchasePriceExchangeRate > 0, 'ConvertibleConsumable: purchase price exchange rate must be > 0');
    require(intrinsicValueExchangeRate > 0, 'ConvertibleConsumable: intrinsic value exchange rate must be > 0');
    require(
      purchasePriceExchangeRate <= intrinsicValueExchangeRate,
      'ConvertibleConsumable: purchase price exchange must be <= intrinsic value exchange rate'
    );

    // enhance: when ERC20 supports ERC165, check token here

    _exchangeToken = exchangeToken;
    _purchasePriceExchangeRate = purchasePriceExchangeRate;
    _intrinsicValueExchangeRate = intrinsicValueExchangeRate;

    if (registerWithExchange) {
      _registerWithExchange();
    }
  }

  function exchangeToken() external override view returns (IERC20) {
    return _exchangeToken;
  }

  function asymmetricalExchangeRate() external override view returns (bool) {
    return _purchasePriceExchangeRate != _intrinsicValueExchangeRate;
  }

  function purchasePriceExchangeRate() external override view returns (uint256) {
    return _purchasePriceExchangeRate;
  }

  function intrinsicValueExchangeRate() external override view returns (uint256) {
    return _intrinsicValueExchangeRate;
  }

  function amountExchangeTokenAvailable() external override view returns (uint256) {
    uint256 amountNeeded = totalSupply().exchangeTokenNeeded(_intrinsicValueExchangeRate);
    uint256 amountExchangeToken = _exchangeToken.balanceOf(address(this));
    if (amountNeeded >= amountExchangeToken) {
      return 0;
    }
    return amountExchangeToken - amountNeeded;
  }

  function _registerWithExchange() internal onlyEnabled {
    IConsumableExchange consumableExchange = IConsumableExchange(address(_exchangeToken));
    consumableExchange.registerToken(_purchasePriceExchangeRate, _intrinsicValueExchangeRate);
  }

  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  ) internal virtual override onlyEnabled {
    _exchangeIfNeeded(sender, amount);

    super._transfer(sender, recipient, amount);
  }

  function _exchangeIfNeeded(address sender, uint256 consumableAmount) internal onlyEnabled {
    uint256 senderBalance = this.balanceOf(sender);
    if (senderBalance < consumableAmount) {
      // no need to use SafeMath since we know that the sender balance < amount
      uint256 consumableAmountNeeded = consumableAmount - senderBalance;

      // assume that they wanted to convert since they knew they didn't have enough to transfer
      _mintByExchange(sender, consumableAmountNeeded);
    }
  }

  function mintByExchange(uint256 consumableAmount) external override {
    _mintByExchange(_msgSender(), consumableAmount);
  }

  /**
   * @dev Converts exchange token into `consumableAmount` of this consumable
   */
  function _mintByExchange(address account, uint256 consumableAmount) internal onlyEnabled {
    uint256 amountExchangeToken = this.amountExchangeTokenNeeded(consumableAmount);

    _exchangeToken.transferFrom(account, address(this), amountExchangeToken);

    _mint(account, consumableAmount);
  }

  function amountExchangeTokenNeeded(uint256 consumableAmount) external override view returns (uint256) {
    return consumableAmount.exchangeTokenNeeded(_purchasePriceExchangeRate);
  }

  function _mint(address account, uint256 amount) internal virtual override {
    super._mint(account, amount);

    uint256 amountNeeded = totalSupply().exchangeTokenNeeded(_intrinsicValueExchangeRate);
    uint256 amountExchangeToken = _exchangeToken.balanceOf(address(this));
    require(amountExchangeToken >= amountNeeded, 'ConvertibleConsumable: Not enough exchange token available to mint');
  }

  function burnByExchange(uint256 consumableAmount) external virtual override {
    _burnByExchange(_msgSender(), consumableAmount);
  }

  /**
   * @dev Converts `consumableAmount` of this consumable into exchange token
   */
  function _burnByExchange(address receiver, uint256 consumableAmount) internal onlyEnabled {
    _burn(receiver, consumableAmount);

    ERC20UpgradeSafe token = ERC20UpgradeSafe(address(_exchangeToken));

    uint256 exchangeTokenAmount = this.amountExchangeTokenProvided(consumableAmount);
    token.increaseAllowance(receiver, exchangeTokenAmount);
  }

  function amountExchangeTokenProvided(uint256 consumableAmount) external override view returns (uint256) {
    return consumableAmount.exchangeTokenProvided(_intrinsicValueExchangeRate);
  }

  uint256[50] private ______gap;
}
