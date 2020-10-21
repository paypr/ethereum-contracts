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

import './LimitedConsumable.sol';
import '../access/DelegatingRoles.sol';

contract ConfigurableLimitedConsumable is
  Initializable,
  ContextUpgradeSafe,
  LimitedConsumable,
  Disableable,
  DelegatingRoles
{
  using TransferLogic for address;

  function initializeLimitedConsumable(
    ContractInfo memory info,
    string memory symbol,
    IRoleDelegate roleDelegate
  ) public initializer {
    _initializeLimitedConsumable(info, symbol);

    _addRoleDelegate(roleDelegate);
  }

  /**
   * @dev Creates `amount` tokens and assigns them to `account`, increasing
   * the total supply.
   *
   * Emits a {Transfer} event with `from` set to the zero address.
   */
  function mint(address account, uint256 amount) external onlyMinter {
    _mint(account, amount);
  }

  /**
   * @dev Destroys `amount` tokens from `account`, reducing the
   * total supply.
   *
   * Emits a {Transfer} event with `to` set to the zero address.
   */
  function burn(address account, uint256 amount) external onlyMinter {
    _burn(account, amount);
  }

  /**
   * @dev Increases the limit for `account` by `addedValue`
   *
   * Emits a {Limited} event
   */
  function increaseLimit(address account, uint256 addedValue) external onlyMinter {
    _increaseLimit(account, addedValue);
  }

  /**
   * @dev Decreases the limit for `account` by `subtractedValue`
   *
   * Emits a {Limited} event
   */
  function decreaseLimit(address account, uint256 subtractedValue) external onlyMinter {
    _decreaseLimit(account, subtractedValue);
  }

  function transferToken(
    IERC20 token,
    uint256 amount,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    address(this).transferToken(token, amount, recipient);
  }

  function transferItem(
    IERC721 artifact,
    uint256 itemId,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    address(this).transferItem(artifact, itemId, recipient);
  }

  function disable() external override onlyAdmin {
    _disable();
  }

  function enable() external override onlyAdmin {
    _enable();
  }
}
