/*
 * Copyright (c) 2020 The Paypr Company
 *
 * This file is NOT part of Paypr Ethereum Contracts and CANNOT be redistributed.
 */

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol';
import '../core/consumable/ConsumableExchange.sol';
import '../core/consumable/ConvertibleConsumable.sol';
import '../core/access/DelegatingRoles.sol';

contract Paypr is ConvertibleConsumable, ConsumableExchange, DelegatingRoles {
  using SafeMath for uint256;

  function initializePaypr(
    IConsumableExchange baseToken,
    uint256 basePurchasePriceExchangeRate,
    uint256 baseIntrinsicValueExchangeRate,
    IRoleDelegate roleDelegate
  ) public initializer {
    ContractInfo memory info = ContractInfo({
      name: 'Paypr',
      description: 'Paypr exchange token',
      uri: 'https://paypr.money/'
    });

    string memory symbol = 'ℙ';

    _initializeConvertibleConsumable(
      info,
      symbol,
      baseToken,
      basePurchasePriceExchangeRate,
      baseIntrinsicValueExchangeRate,
      false
    );
    _initializeConsumableExchange(info, symbol);

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

  function _mint(address account, uint256 amount) internal override(ERC20UpgradeSafe, ConvertibleConsumable) {
    ERC20UpgradeSafe._mint(account, amount);
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

  // TODO: remove onlyMinter when ready to exchange
  function burnByExchange(uint256 payprAmount) external override onlyEnabled onlyMinter {
    _burnByExchange(_msgSender(), payprAmount);
  }

  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  ) internal override(ConsumableExchange, ConvertibleConsumable) onlyEnabled {
    ConsumableExchange._transfer(sender, recipient, amount);
  }

  function transferToken(
    IERC20 token,
    uint256 amount,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    _transferToken(token, amount, recipient);
  }

  function transferItem(
    IERC721 artifact,
    uint256 itemId,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    _transferItem(artifact, itemId, recipient);
  }

  function disable() external override onlyAdmin {
    _disable();
  }

  function enable() external override onlyAdmin {
    _enable();
  }
}
