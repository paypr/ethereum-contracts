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

import '../disableable/DisableableSupport.sol';
import './ERC20Impl.sol';
import './IConsumable.sol';

contract ConsumableFacet is IConsumable {
  function decimals() external pure override returns (uint8) {
    return ERC20Impl.decimals();
  }

  function totalSupply() external view override returns (uint256) {
    return ERC20Impl.totalSupply();
  }

  function balanceOf(address account) external view override returns (uint256) {
    return ERC20Impl.balanceOf(account);
  }

  function myBalance() external view override returns (uint256) {
    return ERC20Impl.myBalance();
  }

  function transfer(address recipient, uint256 amount) external override returns (bool) {
    DisableableSupport.checkEnabled();

    ERC20Impl.transfer(recipient, amount);
    return true;
  }

  function allowance(address owner, address spender) external view override returns (uint256) {
    return ERC20Impl.allowance(owner, spender);
  }

  function myAllowance(address owner) external view override returns (uint256) {
    return ERC20Impl.myAllowance(owner);
  }

  function approve(address spender, uint256 amount) external override returns (bool) {
    DisableableSupport.checkEnabled();

    ERC20Impl.approve(spender, amount);
    return true;
  }

  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  ) external override returns (bool) {
    DisableableSupport.checkEnabled();

    ERC20Impl.transferFrom(sender, recipient, amount);
    return true;
  }

  function increaseAllowance(address spender, uint256 addedValue) external override returns (bool) {
    DisableableSupport.checkEnabled();

    ERC20Impl.increaseAllowance(spender, addedValue);
    return true;
  }

  function decreaseAllowance(address spender, uint256 subtractedValue) external override returns (bool) {
    DisableableSupport.checkEnabled();

    ERC20Impl.decreaseAllowance(spender, subtractedValue);
    return true;
  }
}
