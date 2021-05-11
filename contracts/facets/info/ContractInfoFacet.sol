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
import './IContractInfo.sol';

contract ContractInfoFacet is IContractInfo {
  function name() external view override returns (string memory) {
    return ContractInfoImpl.name();
  }

  function symbol() external view override returns (string memory) {
    return ContractInfoImpl.symbol();
  }

  function description() external view override returns (string memory) {
    return ContractInfoImpl.description();
  }

  function uri() external view override returns (string memory) {
    return ContractInfoImpl.uri();
  }
}
