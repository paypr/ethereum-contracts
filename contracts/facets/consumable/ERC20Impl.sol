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

/*
 * Implementation based on OpenZeppelin Contracts ERC20:
 * https://openzeppelin.com/contracts/
 */

// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.4;

import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import '../../utils/HookUtils.sol';
import '../access/AccessControlSupport.sol';
import '../access/RoleSupport.sol';
import '../context/ContextSupport.sol';
import './IConsumableHooks.sol';

library ERC20Impl {
  using EnumerableSet for EnumerableSet.AddressSet;

  bytes32 private constant ERC20_STORAGE_POSITION = keccak256('paypr.erc20.storage');

  struct ERC20Storage {
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowances;
    uint256 totalSupply;
    EnumerableSet.AddressSet hooks;
  }

  //noinspection NoReturn
  function _erc20Storage() private pure returns (ERC20Storage storage ds) {
    bytes32 position = ERC20_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function checkMinter() internal view {
    AccessControlSupport.checkRole(RoleSupport.MINTER_ROLE);
  }

  function decimals() internal pure returns (uint8) {
    return 18;
  }

  function totalSupply() internal view returns (uint256) {
    return _erc20Storage().totalSupply;
  }

  function balanceOf(address account) internal view returns (uint256) {
    return _erc20Storage().balances[account];
  }

  function myBalance() internal view returns (uint256) {
    return balanceOf(ContextSupport.msgSender());
  }

  function transfer(address recipient, uint256 amount) internal {
    _transfer(ContextSupport.msgSender(), recipient, amount);
  }

  function allowance(address owner, address spender) internal view returns (uint256) {
    return _erc20Storage().allowances[owner][spender];
  }

  function myAllowance(address owner) internal view returns (uint256) {
    return allowance(owner, ContextSupport.msgSender());
  }

  function approve(address spender, uint256 amount) internal {
    _approve(ContextSupport.msgSender(), spender, amount);
  }

  function transferFrom(
    address sender,
    address recipient,
    uint256 amount
  ) internal {
    _transfer(sender, recipient, amount);

    uint256 currentAllowance = _erc20Storage().allowances[sender][ContextSupport.msgSender()];
    require(currentAllowance >= amount, 'ERC20: transfer amount exceeds allowance');

    _approve(sender, ContextSupport.msgSender(), currentAllowance - amount);
  }

  function increaseAllowance(address spender, uint256 addedValue) internal {
    _approve(
      ContextSupport.msgSender(),
      spender,
      _erc20Storage().allowances[ContextSupport.msgSender()][spender] + addedValue
    );
  }

  function decreaseAllowance(address spender, uint256 subtractedValue) internal {
    uint256 currentAllowance = _erc20Storage().allowances[ContextSupport.msgSender()][spender];
    require(currentAllowance >= subtractedValue, 'ERC20: decreased allowance below zero');

    _approve(ContextSupport.msgSender(), spender, currentAllowance - subtractedValue);
  }

  /**
   * @dev Moves tokens `amount` from `sender` to `recipient`.
   *
   * This is internal function is equivalent to {transfer}, and can be used to
   * e.g. implement automatic token fees, slashing mechanisms, etc.
   *
   * Emits a {Transfer} event.
   *
   * Requirements:
   *
   * - `sender` cannot be the zero address.
   * - `recipient` cannot be the zero address.
   * - `sender` must have a balance of at least `amount`.
   */
  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  ) internal {
    require(sender != address(0), 'ERC20: transfer from the zero address');
    require(recipient != address(0), 'ERC20: transfer to the zero address');

    _beforeTokenTransfer(sender, recipient, amount);

    ERC20Storage storage erc20Storage = _erc20Storage();

    uint256 senderBalance = erc20Storage.balances[sender];
    require(senderBalance >= amount, 'ERC20: transfer amount exceeds balance');
    erc20Storage.balances[sender] = senderBalance - amount;
    erc20Storage.balances[recipient] += amount;

    _afterTokenTransfer(sender, recipient, amount);

    emit Transfer(sender, recipient, amount);
  }

  /** @dev Creates `amount` tokens and assigns them to `account`, increasing
   * the total supply.
   *
   * Emits a {Transfer} event with `from` set to the zero address.
   *
   * Requirements:
   *
   * - `to` cannot be the zero address.
   */
  function mint(address account, uint256 amount) internal {
    require(account != address(0), 'ERC20: mint to the zero address');

    _beforeMint(account, amount);

    ERC20Storage storage erc20Storage = _erc20Storage();

    erc20Storage.totalSupply += amount;
    erc20Storage.balances[account] += amount;

    _afterMint(account, amount);

    emit Transfer(address(0), account, amount);
  }

  /**
   * @dev Destroys `amount` tokens from `account`, reducing the
   * total supply.
   *
   * Emits a {Transfer} event with `to` set to the zero address.
   *
   * Requirements:
   *
   * - `account` cannot be the zero address.
   * - `account` must have at least `amount` tokens.
   */
  function burn(address account, uint256 amount) internal {
    require(account != address(0), 'ERC20: burn from the zero address');

    _beforeBurn(account, amount);

    ERC20Storage storage erc20Storage = _erc20Storage();

    uint256 accountBalance = erc20Storage.balances[account];
    require(accountBalance >= amount, 'ERC20: burn amount exceeds balance');
    erc20Storage.balances[account] = accountBalance - amount;
    erc20Storage.totalSupply -= amount;

    _afterBurn(account, amount);

    emit Transfer(account, address(0), amount);
  }

  /**
   * @dev Sets `amount` as the allowance of `spender` over the `owner` s tokens.
   *
   * This internal function is equivalent to `approve`, and can be used to
   * e.g. set automatic allowances for certain subsystems, etc.
   *
   * Emits an {Approval} event.
   *
   * Requirements:
   *
   * - `owner` cannot be the zero address.
   * - `spender` cannot be the zero address.
   */
  function _approve(
    address owner,
    address spender,
    uint256 amount
  ) internal {
    require(owner != address(0), 'ERC20: approve from the zero address');
    require(spender != address(0), 'ERC20: approve to the zero address');

    _erc20Storage().allowances[owner][spender] = amount;

    emit Approval(owner, spender, amount);
  }

  function addHooks(IConsumableHooks consumableHooks) internal {
    require(address(consumableHooks) != address(0), 'ERC20: adding hook of the zero address');

    _erc20Storage().hooks.add(address(consumableHooks));
  }

  function removeHooks(IConsumableHooks consumableHooks) internal {
    require(address(consumableHooks) != address(0), 'ERC20: removing hook of the zero address');

    _erc20Storage().hooks.remove(address(consumableHooks));
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal {
    bytes memory callData = abi.encodeWithSelector(IConsumableHooks.beforeTokenTransfer.selector, from, to, amount);
    _executeHooks(callData);
  }

  function _afterTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal {
    bytes memory callData = abi.encodeWithSelector(IConsumableHooks.afterTokenTransfer.selector, from, to, amount);
    _executeHooks(callData);
  }

  function _beforeMint(address account, uint256 amount) private {
    bytes memory callData = abi.encodeWithSelector(IConsumableHooks.beforeMint.selector, account, amount);
    _executeHooks(callData);

    _beforeTokenTransfer(address(0), account, amount);
  }

  function _afterMint(address account, uint256 amount) private {
    _afterTokenTransfer(address(0), account, amount);

    bytes memory callData = abi.encodeWithSelector(IConsumableHooks.afterMint.selector, account, amount);
    _executeHooks(callData);
  }

  function _beforeBurn(address account, uint256 amount) private {
    bytes memory callData = abi.encodeWithSelector(IConsumableHooks.beforeBurn.selector, account, amount);
    _executeHooks(callData);

    _beforeTokenTransfer(account, address(0), amount);
  }

  function _afterBurn(address account, uint256 amount) private {
    _afterTokenTransfer(account, address(0), amount);

    bytes memory callData = abi.encodeWithSelector(IConsumableHooks.afterBurn.selector, account, amount);
    _executeHooks(callData);
  }

  function _executeHooks(bytes memory callData) private {
    EnumerableSet.AddressSet storage hooks = _erc20Storage().hooks;
    HookUtils.executeHooks(hooks, callData);
  }

  // have to redeclare here even though they are already declared in IERC20
  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}
