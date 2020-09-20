// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './ConvertibleConsumable.sol';
import '../access/DelegatingRoles.sol';

contract ConfigurableConvertibleConsumable is ConvertibleConsumable, DelegatingRoles {
  function initializeConvertibleConsumable(
    ContractInfo memory info,
    string memory symbol,
    IERC20 exchangeToken,
    uint256 exchangeRate,
    bool registerWithExchange,
    IRoleDelegate roleDelegate
  ) public initializer {
    _initializeConvertibleConsumable(info, symbol, exchangeToken, exchangeRate, registerWithExchange);

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
   * @dev Registers this token with the exchange
   */
  function registerWithExchange() external onlyMinter {
    _registerWithExchange();
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
