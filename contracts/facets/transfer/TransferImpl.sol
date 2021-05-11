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

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import '../../utils/HookUtils.sol';
import '../access/RoleSupport.sol';
import '../access/AccessControlSupport.sol';
import './ITransferring.sol';
import './ITransferHooks.sol';

library TransferImpl {
  using EnumerableSet for EnumerableSet.AddressSet;

  bytes32 private constant TRANSFER_STORAGE_POSITION = keccak256('paypr.transfer.storage');

  struct TransferStorage {
    EnumerableSet.AddressSet hooks;
  }

  //noinspection NoReturn
  function _transferStorage() private pure returns (TransferStorage storage ds) {
    bytes32 position = TRANSFER_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function checkTransferAgent() internal view {
    AccessControlSupport.checkRole(RoleSupport.TRANSFER_AGENT_ROLE);
  }

  function transferToken(
    IERC20 token,
    uint256 amount,
    address recipient
  ) internal {
    _beforeTokenTransfer(token, amount, recipient);

    token.transfer(recipient, amount);

    _afterTokenTransfer(token, amount, recipient);
  }

  function transferItem(
    IERC721 artifact,
    uint256 itemId,
    address recipient
  ) internal {
    _beforeItemTransfer(artifact, itemId, recipient);

    artifact.safeTransferFrom(address(this), recipient, itemId);

    _afterItemTransfer(artifact, itemId, recipient);
  }

  function onERC721Received() internal pure returns (bytes4) {
    return ITransferring.onERC721Received.selector;
  }

  function addHooks(ITransferHooks transferHooks) internal {
    require(address(transferHooks) != address(0), 'Transfer: adding hook of the zero address');

    _transferStorage().hooks.add(address(transferHooks));
  }

  function removeHooks(ITransferHooks transferHooks) internal {
    require(address(transferHooks) != address(0), 'Transfer: removing hook of the zero address');

    _transferStorage().hooks.remove(address(transferHooks));
  }

  function _beforeTokenTransfer(
    IERC20 token,
    uint256 amount,
    address recipient
  ) internal {
    bytes memory callData = abi.encodeWithSelector(
      ITransferHooks.beforeTokenTransfer.selector,
      token,
      amount,
      recipient
    );
    _executeHooks(callData);
  }

  function _afterTokenTransfer(
    IERC20 token,
    uint256 amount,
    address recipient
  ) internal {
    bytes memory callData = abi.encodeWithSelector(
      ITransferHooks.afterTokenTransfer.selector,
      token,
      amount,
      recipient
    );
    _executeHooks(callData);
  }

  function _beforeItemTransfer(
    IERC721 artifact,
    uint256 itemId,
    address recipient
  ) internal {
    bytes memory callData = abi.encodeWithSelector(
      ITransferHooks.beforeItemTransfer.selector,
      artifact,
      itemId,
      recipient
    );
    _executeHooks(callData);
  }

  function _afterItemTransfer(
    IERC721 artifact,
    uint256 itemId,
    address recipient
  ) internal {
    bytes memory callData = abi.encodeWithSelector(
      ITransferHooks.afterItemTransfer.selector,
      artifact,
      itemId,
      recipient
    );
    _executeHooks(callData);
  }

  function _executeHooks(bytes memory callData) private {
    EnumerableSet.AddressSet storage hooks = _transferStorage().hooks;
    HookUtils.executeHooks(hooks, callData);
  }
}
