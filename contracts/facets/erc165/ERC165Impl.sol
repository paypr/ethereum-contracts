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

library ERC165Impl {
  bytes32 private constant ERC165_STORAGE_POSITION = keccak256('paypr.erc165.storage');

  struct ERC165Storage {
    mapping(bytes4 => bool) supportedInterfaces;
  }

  //noinspection NoReturn
  function _erc165Storage() private pure returns (ERC165Storage storage ds) {
    bytes32 position = ERC165_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function isInterfaceSupported(bytes4 interfaceId) internal view returns (bool) {
    ERC165Storage storage ds = _erc165Storage();
    return ds.supportedInterfaces[interfaceId];
  }

  function setInterfaceSupported(bytes4 interfaceId) internal {
    updateInterfaceSupported(interfaceId, true);
  }

  function clearInterfaceSupported(bytes4 interfaceId) internal {
    updateInterfaceSupported(interfaceId, false);
  }

  function updateInterfaceSupported(bytes4 interfaceId, bool value) internal {
    ERC165Storage storage ds = _erc165Storage();
    if (interfaceId != bytes4(0)) {
      ds.supportedInterfaces[interfaceId] = value;
    }
  }
}
