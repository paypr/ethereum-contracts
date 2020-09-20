// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './LimitedConsumable.sol';
import '../access/DelegatingRoles.sol';

contract ConfigurableLimitedConsumable is LimitedConsumable, DelegatingRoles {
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
