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

import './ContractInfoImpl.sol';

contract ContractInfoInit {
  struct InfoData {
    string name;
    string symbol;
    string description;
    string uri;
    bool includeAddressInUri;
  }

  function initialize(InfoData calldata info) external {
    ContractInfoImpl.setName(info.name);
    ContractInfoImpl.setSymbol(info.symbol);
    ContractInfoImpl.setDescription(info.description);
    ContractInfoImpl.setUri(info.uri);
    ContractInfoImpl.setIncludeAddressInUri(info.includeAddressInUri);
  }

  function setName(string calldata name) external {
    ContractInfoImpl.setName(name);
  }

  function setSymbol(string calldata symbol) external {
    ContractInfoImpl.setSymbol(symbol);
  }

  function setDescription(string calldata description) external {
    ContractInfoImpl.setDescription(description);
  }

  function setUri(string calldata uri) external {
    ContractInfoImpl.setUri(uri);
  }

  function setIncludeAddressInUri(bool includeAddress) external {
    ContractInfoImpl.setIncludeAddressInUri(includeAddress);
  }
}
