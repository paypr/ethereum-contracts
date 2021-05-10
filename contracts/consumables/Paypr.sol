/*
 * Copyright (c) 2020 The Paypr Company, LLC
 *
 * This file is NOT part of Paypr Ethereum Contracts and CANNOT be redistributed.
 */

// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.3;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol';
import '../core/consumable/ConsumableExchange.sol';
import '../core/consumable/ConvertibleConsumable.sol';
import '../core/access/DelegatingRoles.sol';

contract Paypr is
  Initializable,
  ContextUpgradeable,
  ERC165StorageUpgradeable,
  BaseContract,
  Consumable,
  ConvertibleConsumable,
  ConsumableExchange,
  Disableable,
  DelegatingRoles
{
  using SafeMathUpgradeable for uint256;
  using TransferLogic for address;

  function initializePaypr(
    IConsumableExchange baseToken,
    uint256 basePurchasePriceExchangeRate,
    uint256 baseIntrinsicValueExchangeRate,
    IRoleDelegate roleDelegate
  ) public initializer {
    ContractInfo memory info =
      ContractInfo({ name: 'Paypr', description: 'Paypr exchange token', uri: 'https://paypr.money/' });

    string memory symbol = unicode'ℙ';

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

  function _mint(address account, uint256 amount) internal override(ERC20Upgradeable, ConvertibleConsumable) {
    ERC20Upgradeable._mint(account, amount);
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
  ) internal override(Consumable, ConsumableExchange, ConvertibleConsumable) onlyEnabled {
    ConvertibleConsumable._transfer(sender, recipient, amount);
  }

  function transferToken(
    IERC20Upgradeable token,
    uint256 amount,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    address(this).transferToken(token, amount, recipient);
  }

  function transferItem(
    IERC721Upgradeable artifact,
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
