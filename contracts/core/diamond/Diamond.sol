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

/*
 * Based on EIP-2535 reference implementation by Nick Mudge: https://github.com/mudgen/Diamond
 *
 * EIP-2535 Diamond Standard: https://eips.ethereum.org/EIPS/eip-2535
 */

// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.4;

import '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import '../../facets/access/AccessControlImpl.sol';
import '../../facets/context/ContextSupport.sol';
import '../../facets/diamond/DiamondImpl.sol';
import '../../facets/diamond/IDiamondLoupe.sol';
import '../../facets/diamond/IDiamondCut.sol';

/**
 * Implementation of a diamond.
 */
contract Diamond {
  struct DiamondConstructorParams {
    IDiamondCut.DiamondInitFunction initFunction;
    IDiamondCut.FacetCut[] diamondCuts;
  }

  constructor(DiamondConstructorParams memory params) {
    DiamondImpl.diamondCut(params.diamondCuts, params.initFunction);
  }

  // Find facet for function that is called and execute the
  // function if a facet is found and return any value.
  // solhint-disable-next-line no-complex-fallback
  fallback() external payable {
    DiamondImpl.DiamondStorage storage ds = DiamondImpl.diamondStorage();

    address facet = address(bytes20(ds.facetAddressAndSelectorPosition[msg.sig].facetAddress));
    require(facet != address(0), 'Diamond: Function does not exist');

    // solhint-disable-next-line no-inline-assembly
    assembly {
      calldatacopy(0, 0, calldatasize())
      let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
      returndatacopy(0, 0, returndatasize())
      switch result
      case 0 {
        revert(0, returndatasize())
      }
      default {
        return(0, returndatasize())
      }
    }
  }
}
