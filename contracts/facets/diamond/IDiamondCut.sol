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

import './DiamondInit.sol';

interface IDiamondCut {
  // Add=0, Replace=1, Remove=2
  enum FacetCutAction {
    Add,
    Replace,
    Remove
  }

  struct FacetCut {
    address facetAddress;
    FacetCutAction action;
    bytes4[] functionSelectors;
    bytes4 interfaceId;
  }

  struct DiamondInitFunction {
    address initAddress;
    bytes callData;
  }

  /**
   * @notice Add, replace, or remove any functions and optionally execute an init function
   *
   * @param diamondCuts Contains the facet addresses and function selectors
   * @param initFunction The function to use to initialize the cuts, if any
   */
  function diamondCut(FacetCut[] calldata diamondCuts, DiamondInitFunction calldata initFunction) external;

  event DiamondCut(FacetCut[] diamondCuts, DiamondInitFunction initFunction);
}
