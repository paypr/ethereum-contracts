/*
 * Copyright (c) 2020 The Paypr Company
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

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol';
import './ConsumableInterfaceSupport.sol';
import './IConsumable.sol';
import '../BaseContract.sol';
import '../Disableable.sol';
import '../transfer/TransferringInterfaceSupport.sol';
import '../transfer/ITransferring.sol';
import '../transfer/TransferLogic.sol';

abstract contract Consumable is
  IDisableable,
  Initializable,
  ITransferring,
  ContextUpgradeSafe,
  IConsumable,
  ERC165UpgradeSafe,
  BaseContract,
  ERC20UpgradeSafe
{
  using TransferLogic for address;

  function _initializeConsumable(ContractInfo memory info, string memory symbol) internal initializer {
    _initializeBaseContract(info);
    _registerInterface(ConsumableInterfaceSupport.CONSUMABLE_INTERFACE_ID);

    __ERC20_init(info.name, symbol);
    _registerInterface(TransferringInterfaceSupport.TRANSFERRING_INTERFACE_ID);
  }

  function myBalance() external override view returns (uint256) {
    return balanceOf(_msgSender());
  }

  function myAllowance(address owner) external override view returns (uint256) {
    return allowance(owner, _msgSender());
  }

  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  ) internal virtual override onlyEnabled {
    super._transfer(sender, recipient, amount);
  }

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external virtual override returns (bytes4) {
    return TransferLogic.onERC721Received(operator, from, tokenId, data);
  }

  uint256[50] private ______gap;
}
