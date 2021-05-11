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

interface IConsumableHooks {
  /**
   * @dev Hook that is called before any transfer of tokens. This includes
   * minting and burning.
   *
   * Calling conditions:
   *
   * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
   * will be to transferred to `to`.
   * - when `from` is zero, `amount` tokens will be minted for `to`.
   * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
   * - `from` and `to` are never both zero.
   */
  function beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) external;

  /**
   * @dev Hook that is called after any transfer of tokens. This includes
   * minting and burning. Called before Transfer event sent.
   *
   * Calling conditions:
   *
   * - when `from` and `to` are both non-zero, `amount` of ``from``'s tokens
   * will be to transferred to `to`.
   * - when `from` is zero, `amount` tokens will be minted for `to`.
   * - when `to` is zero, `amount` of ``from``'s tokens will be burned.
   * - `from` and `to` are never both zero.
   */
  function afterTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) external;

  /**
   * @dev Hook that is called before minting tokens. Called before any beforeTokenTransfer hooks.
   */
  function beforeMint(address account, uint256 amount) external;

  /**
   * @dev Hook that is called after minting tokens. Called after any afterTokenTransfer hooks.
   */
  function afterMint(address account, uint256 amount) external;

  /**
   * @dev Hook that is called before burning tokens. Called before any beforeTokenTransfer hooks.
   */
  function beforeBurn(address account, uint256 amount) external;

  /**
   * @dev Hook that is called after burning tokens. Called after any afterTokenTransfer hooks.
   */
  function afterBurn(address account, uint256 amount) external;
}
