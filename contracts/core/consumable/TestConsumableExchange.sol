// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './ConsumableExchange.sol';
import '../access/Roles.sol';

contract TestConsumableExchange is ConsumableExchange, Roles {
  function initializeConsumableExchange(ContractInfo memory info, string memory symbol) public initializer {
    _initializeConsumableExchange(info, symbol);

    _addSuperAdmin(_msgSender());
    _addAdmin(_msgSender());
    _addMinter(_msgSender());
    _addTransferAgent(_msgSender());
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

  function disable() external override onlyAdmin {
    _disable();
  }

  function enable() external override onlyAdmin {
    _enable();
  }
}
