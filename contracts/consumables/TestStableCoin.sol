// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol';
import '../core/access/Roles.sol';

contract TestStableCoin is ERC20UpgradeSafe, Roles {
  function initialize() external initializer {
    __ERC20_init('MyStableCoin', 'MSC');

    _addSuperAdmin(_msgSender());
    _addMinter(_msgSender());
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
}
