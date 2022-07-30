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

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '../../context/ContextSupport.sol';
import '../ConsumableSupport.sol';
import '../ERC20Impl.sol';
import './ConsumableConversionMath.sol';

library ConsumableConversionImpl {
  using SafeMath for uint256;
  using ConsumableConversionMath for uint256;

  bytes32 private constant CONSUMABLE_CONVERSION_STORAGE_POSITION = keccak256('paypr.consumableConversion.storage');

  struct ConsumableConversionStorage {
    /**
     * The token used to exchange for this consumable
     */
    IERC20 exchangeToken;
    /**
     * The amount that 1 of exchangeToken will convert into this consumable
     * eg if purchasePriceExchangeRate is 1000, then 1 exchangeToken will purchase 1000 of this token
     */
    uint256 purchasePriceExchangeRate;
    /*
     * The amount of this token needed to exchange for 1 exchangeToken
     * eg if intrinsicValueExchangeRate is 1000, then 1000 of this is needed to exchange for 1 exchangeToken
     */
    uint256 intrinsicValueExchangeRate;
  }

  //noinspection NoReturn
  function _consumableConversionStorage() private pure returns (ConsumableConversionStorage storage ds) {
    bytes32 position = CONSUMABLE_CONVERSION_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function exchangeToken() internal view returns (IERC20) {
    return _consumableConversionStorage().exchangeToken;
  }

  function setExchangeToken(IERC20 _exchangeToken) internal {
    require(address(_exchangeToken) != address(0), 'ConsumableConversion: exchange token cannot be the zero address');

    _consumableConversionStorage().exchangeToken = _exchangeToken;
  }

  function asymmetricalExchangeRate() internal view returns (bool) {
    ConsumableConversionStorage storage ccs = _consumableConversionStorage();
    return ccs.purchasePriceExchangeRate != ccs.intrinsicValueExchangeRate;
  }

  function intrinsicValueExchangeRate() internal view returns (uint256) {
    return _consumableConversionStorage().intrinsicValueExchangeRate;
  }

  function purchasePriceExchangeRate() internal view returns (uint256) {
    return _consumableConversionStorage().purchasePriceExchangeRate;
  }

  function setExchangeRate(uint256 _exchangeRate) internal {
    require(_exchangeRate > 0, 'ConsumableConversion: exchange rate must be > 0');

    ConsumableConversionStorage storage ccs = _consumableConversionStorage();

    ccs.intrinsicValueExchangeRate = _exchangeRate;
    ccs.purchasePriceExchangeRate = _exchangeRate;
  }

  function setExchangeRates(uint256 _intrinsicValueExchangeRate, uint256 _purchasePriceExchangeRate) internal {
    require(_intrinsicValueExchangeRate > 0, 'ConsumableConversion: intrinsic value exchange rate must be > 0');
    require(_purchasePriceExchangeRate > 0, 'ConsumableConversion: purchase price exchange rate must be > 0');
    require(
      _purchasePriceExchangeRate <= _intrinsicValueExchangeRate,
      'ConsumableConversion: purchase price exchange rate must be <= intrinsic value exchange rate'
    );

    ConsumableConversionStorage storage ccs = _consumableConversionStorage();

    ccs.intrinsicValueExchangeRate = _intrinsicValueExchangeRate;
    ccs.purchasePriceExchangeRate = _purchasePriceExchangeRate;
  }

  function registerWithExchange() internal {
    ConsumableConversionStorage storage ccs = _consumableConversionStorage();
    IConsumableExchange consumableExchange = IConsumableExchange(address(ccs.exchangeToken));
    consumableExchange.registerToken(ccs.purchasePriceExchangeRate, ccs.intrinsicValueExchangeRate);
  }

  function amountExchangeTokenAvailable() internal view returns (uint256) {
    ConsumableConversionStorage storage ccs = _consumableConversionStorage();

    uint256 amountNeeded = ConsumableSupport.totalSupply().exchangeTokenNeeded(ccs.intrinsicValueExchangeRate);
    uint256 amountExchangeToken = ccs.exchangeToken.balanceOf(address(this));
    if (amountNeeded >= amountExchangeToken) {
      return 0;
    }
    return amountExchangeToken - amountNeeded;
  }

  function exchangeIfNeeded(address sender, uint256 consumableAmount) internal {
    uint256 senderBalance = ConsumableSupport.balanceOf(sender);
    if (senderBalance < consumableAmount) {
      // no need to use SafeMath since we know that the sender balance < amount
      uint256 consumableAmountNeeded = consumableAmount - senderBalance;

      // assume that they wanted to convert since they knew they didn't have enough to transfer
      mintByExchange(sender, consumableAmountNeeded);
    }
  }

  /**
   * @dev Converts exchange token into `consumableAmount` of this consumable
   */
  function mintByExchange(address account, uint256 consumableAmount) internal {
    uint256 amountExchangeToken = amountExchangeTokenNeeded(consumableAmount);

    _consumableConversionStorage().exchangeToken.transferFrom(account, address(this), amountExchangeToken);

    ERC20Impl.mint(account, consumableAmount);
  }

  function amountExchangeTokenNeeded(uint256 consumableAmount) internal view returns (uint256) {
    return consumableAmount.exchangeTokenNeeded(_consumableConversionStorage().purchasePriceExchangeRate);
  }

  function checkEnoughExchangeTokenAvailable() internal view {
    ConsumableConversionStorage storage ccs = _consumableConversionStorage();

    uint256 amountNeeded = ConsumableSupport.totalSupply().exchangeTokenNeeded(ccs.intrinsicValueExchangeRate);
    uint256 amountExchangeToken = ccs.exchangeToken.balanceOf(address(this));
    require(amountExchangeToken >= amountNeeded, 'ConsumableConversion: Not enough exchange token available to mint');
  }

  /**
   * @dev Converts `consumableAmount` of this consumable into exchange token
   */
  function burnByExchange(address receiver, uint256 consumableAmount) internal {
    ERC20Impl.burn(receiver, consumableAmount);

    ERC20 token = ERC20(address(_consumableConversionStorage().exchangeToken));

    uint256 exchangeTokenAmount = amountExchangeTokenProvided(consumableAmount);
    token.increaseAllowance(receiver, exchangeTokenAmount);
  }

  function amountExchangeTokenProvided(uint256 consumableAmount) internal view returns (uint256) {
    return consumableAmount.exchangeTokenProvided(_consumableConversionStorage().intrinsicValueExchangeRate);
  }
}
