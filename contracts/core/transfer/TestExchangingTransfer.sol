/*
 * Copyright (c) 2020 The Paypr Company, LLC
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

pragma solidity ^0.8.3;

import '@openzeppelin/contracts-upgradeable/utils/introspection/ERC165StorageUpgradeable.sol';
import './TransferringInterfaceSupport.sol';
import '../access/Roles.sol';
import '../Disableable.sol';
import './ITransferring.sol';
import './TransferLogic.sol';

contract TestExchangingTransfer is ITransferring, ERC165StorageUpgradeable, Disableable, Roles {
  using TransferLogic for address;

  function initializeExchangingTestTransfer() external initializer {
    _registerInterface(TransferringInterfaceSupport.TRANSFERRING_INTERFACE_ID);
    _addSuperAdmin(_msgSender());
    _addAdmin(_msgSender());
    _addTransferAgent(_msgSender());
  }

  function transferToken(
    IERC20Upgradeable token,
    uint256 amount,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    address(this).transferTokenWithExchange(token, amount, recipient);
  }

  function transferItem(
    IERC721Upgradeable artifact,
    uint256 itemId,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    address(this).transferItem(artifact, itemId, recipient);
  }

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external virtual override returns (bytes4) {
    return TransferLogic.onERC721Received(operator, from, tokenId, data);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(IERC165Upgradeable, AccessControlUpgradeable, ERC165StorageUpgradeable)
    returns (bool)
  {
    return ERC165StorageUpgradeable.supportsInterface(interfaceId);
  }

  function disable() external override onlyAdmin {
    _disable();
  }

  function enable() external override onlyAdmin {
    _enable();
  }
}
