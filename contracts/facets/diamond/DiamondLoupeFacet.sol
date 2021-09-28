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

import './IDiamondLoupe.sol';
import './DiamondImpl.sol';

contract DiamondLoupeFacet is IDiamondLoupe {
  // Diamond Loupe Functions
  ////////////////////////////////////////////////////////////////////
  /// These functions are expected to be called frequently by tools.
  //
  // struct Facet {
  //     address facetAddress;
  //     bytes4[] functionSelectors;
  // }
  /// @notice Gets all facets and their selectors.
  /// @return facets_ Facet
  function facets() external view override returns (Facet[] memory facets_) {
    DiamondImpl.DiamondStorage storage ds = DiamondImpl.diamondStorage();
    uint256 selectorCount = ds.selectors.length;
    // create an array set to the maximum size possible
    facets_ = new Facet[](selectorCount);
    // create an array for counting the number of selectors for each facet
    uint8[] memory numFacetSelectors = new uint8[](selectorCount);
    // total number of facets
    uint256 numFacets;
    // loop through function selectors
    for (uint256 selectorIndex; selectorIndex < selectorCount; selectorIndex++) {
      bytes4 selector = ds.selectors[selectorIndex];
      address facetAddress_ = ds.facetAddressAndSelectorPosition[selector].facetAddress;
      bool continueLoop = false;
      // find the functionSelectors array for selector and add selector to it
      for (uint256 facetIndex; facetIndex < numFacets; facetIndex++) {
        if (facets_[facetIndex].facetAddress == facetAddress_) {
          facets_[facetIndex].functionSelectors[numFacetSelectors[facetIndex]] = selector;
          // probably will never have more than 256 functions from one facet contract
          require(numFacetSelectors[facetIndex] < 255, 'DiamondLoupe: Too many facet selectors for single contract');
          numFacetSelectors[facetIndex]++;
          continueLoop = true;
          break;
        }
      }
      // if functionSelectors array exists for selector then continue loop
      if (continueLoop) {
        continueLoop = false;
        continue;
      }
      // create a new functionSelectors array for selector
      facets_[numFacets].facetAddress = facetAddress_;
      facets_[numFacets].functionSelectors = new bytes4[](selectorCount);
      facets_[numFacets].functionSelectors[0] = selector;
      numFacetSelectors[numFacets] = 1;
      numFacets++;
    }
    for (uint256 facetIndex; facetIndex < numFacets; facetIndex++) {
      uint256 numSelectors = numFacetSelectors[facetIndex];
      bytes4[] memory selectors = facets_[facetIndex].functionSelectors;
      // setting the number of selectors
      // solhint-disable-next-line no-inline-assembly
      assembly {
        mstore(selectors, numSelectors)
      }
    }
    // setting the number of facets
    // solhint-disable-next-line no-inline-assembly
    assembly {
      mstore(facets_, numFacets)
    }
  }

  /// @notice Gets all the function selectors supported by a specific facet.
  /// @param _facet The facet address.
  /// @return _facetFunctionSelectors The selectors associated with a facet address.
  function facetFunctionSelectors(address _facet)
    external
    view
    override
    returns (bytes4[] memory _facetFunctionSelectors)
  {
    DiamondImpl.DiamondStorage storage ds = DiamondImpl.diamondStorage();
    uint256 selectorCount = ds.selectors.length;
    uint256 numSelectors;
    _facetFunctionSelectors = new bytes4[](selectorCount);
    // loop through function selectors
    for (uint256 selectorIndex; selectorIndex < selectorCount; selectorIndex++) {
      bytes4 selector = ds.selectors[selectorIndex];
      address facetAddress_ = ds.facetAddressAndSelectorPosition[selector].facetAddress;
      if (_facet == facetAddress_) {
        _facetFunctionSelectors[numSelectors] = selector;
        numSelectors++;
      }
    }
    // Set the number of selectors in the array
    // solhint-disable-next-line no-inline-assembly
    assembly {
      mstore(_facetFunctionSelectors, numSelectors)
    }
  }

  /// @notice Get all the facet addresses used by a diamond.
  /// @return facetAddresses_
  function facetAddresses() external view override returns (address[] memory facetAddresses_) {
    DiamondImpl.DiamondStorage storage ds = DiamondImpl.diamondStorage();
    uint256 selectorCount = ds.selectors.length;
    // create an array set to the maximum size possible
    facetAddresses_ = new address[](selectorCount);
    uint256 numFacets;
    // loop through function selectors
    for (uint256 selectorIndex; selectorIndex < selectorCount; selectorIndex++) {
      bytes4 selector = ds.selectors[selectorIndex];
      address facetAddress_ = ds.facetAddressAndSelectorPosition[selector].facetAddress;
      bool continueLoop = false;
      // see if we have collected the address already and break out of loop if we have
      for (uint256 facetIndex; facetIndex < numFacets; facetIndex++) {
        if (facetAddress_ == facetAddresses_[facetIndex]) {
          continueLoop = true;
          break;
        }
      }
      // continue loop if we already have the address
      if (continueLoop) {
        continueLoop = false;
        continue;
      }
      // include address
      facetAddresses_[numFacets] = facetAddress_;
      numFacets++;
    }
    // Set the number of facet addresses in the array
    // solhint-disable-next-line no-inline-assembly
    assembly {
      mstore(facetAddresses_, numFacets)
    }
  }

  /// @notice Gets the facet address that supports the given selector.
  /// @dev If facet is not found return address(0).
  /// @param functionSelector The function selector.
  /// @return The facet address.
  function facetAddress(bytes4 functionSelector) external view override returns (address) {
    return DiamondImpl.facetAddress(functionSelector);
  }
}
