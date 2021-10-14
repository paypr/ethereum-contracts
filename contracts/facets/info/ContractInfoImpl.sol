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

import '@openzeppelin/contracts/utils/Strings.sol';

library ContractInfoImpl {
  bytes32 private constant CONTRACT_INFO_STORAGE_POSITION = keccak256('paypr.contractInfo.storage');

  struct ContractInfoStorage {
    string name;
    string symbol;
    string description;
    string uri;
    bool includeAddressInUri;
  }

  //noinspection NoReturn
  function _contractInfoStorage() private pure returns (ContractInfoStorage storage ds) {
    bytes32 position = CONTRACT_INFO_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function name() internal view returns (string memory) {
    return _contractInfoStorage().name;
  }

  function setName(string memory _name) internal {
    _contractInfoStorage().name = _name;
  }

  function symbol() internal view returns (string memory) {
    return _contractInfoStorage().symbol;
  }

  function setSymbol(string memory _symbol) internal {
    _contractInfoStorage().symbol = _symbol;
  }

  function description() internal view returns (string memory) {
    return _contractInfoStorage().description;
  }

  function setDescription(string memory _description) internal {
    _contractInfoStorage().description = _description;
  }

  function uri() internal view returns (string memory) {
    ContractInfoStorage storage ds = _contractInfoStorage();

    if (bytes(ds.uri).length == 0) {
      return '';
    }

    if (!ds.includeAddressInUri) {
      return ds.uri;
    }

    return string(abi.encodePacked(ds.uri, Strings.toHexString(uint160(address(this)))));
  }

  function setUri(string memory _uri) internal {
    _contractInfoStorage().uri = _uri;
  }

  function includeAddressInUri() internal view returns (bool) {
    return _contractInfoStorage().includeAddressInUri;
  }

  function setIncludeAddressInUri(bool includeAddress) internal {
    _contractInfoStorage().includeAddressInUri = includeAddress;
  }
}
