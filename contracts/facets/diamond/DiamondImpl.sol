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

import '@openzeppelin/contracts/utils/Strings.sol';
import '../access/RoleSupport.sol';
import '../access/AccessCheckSupport.sol';
import '../diamond/IDiamondCut.sol';
import '../erc165/ERC165Impl.sol';

library DiamondImpl {
  bytes32 private constant DIAMOND_STORAGE_POSITION = keccak256('diamond.standard.diamond.storage');

  struct FacetAddressAndSelectorPosition {
    address facetAddress;
    uint16 selectorPosition;
  }

  struct DiamondStorage {
    // function selector => facet address and selector position in selectors array
    mapping(bytes4 => FacetAddressAndSelectorPosition) facetAddressAndSelectorPosition;
    bytes4[] selectors;
  }

  //noinspection NoReturn
  function diamondStorage() internal pure returns (DiamondStorage storage ds) {
    bytes32 position = DIAMOND_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function checkDiamondCutter() internal view {
    AccessCheckSupport.checkRole(RoleSupport.DIAMOND_CUTTER_ROLE);
  }

  function facetAddress(bytes4 functionSelector) internal view returns (address) {
    return diamondStorage().facetAddressAndSelectorPosition[functionSelector].facetAddress;
  }

  function diamondCut(IDiamondCut.FacetCut[] memory diamondCuts, IDiamondCut.DiamondInitFunction memory initFunction)
    internal
  {
    for (uint256 facetIndex; facetIndex < diamondCuts.length; facetIndex++) {
      IDiamondCut.FacetCutAction action = diamondCuts[facetIndex].action;
      if (action == IDiamondCut.FacetCutAction.Add) {
        _addFunctions(
          diamondCuts[facetIndex].facetAddress,
          diamondCuts[facetIndex].functionSelectors,
          diamondCuts[facetIndex].interfaceId
        );
      } else if (action == IDiamondCut.FacetCutAction.Replace) {
        _replaceFunctions(diamondCuts[facetIndex].facetAddress, diamondCuts[facetIndex].functionSelectors);
      } else if (action == IDiamondCut.FacetCutAction.Remove) {
        _removeFunctions(
          diamondCuts[facetIndex].facetAddress,
          diamondCuts[facetIndex].functionSelectors,
          diamondCuts[facetIndex].interfaceId
        );
      } else {
        revert(string(abi.encodePacked('DiamondCut: Incorrect FacetCutAction: ', Strings.toHexString(uint8(action)))));
      }
    }
    emit DiamondCut(diamondCuts, initFunction);
    initializeDiamondCut(initFunction.initAddress, initFunction.callData);
  }

  function _addFunctions(
    address _facetAddress,
    bytes4[] memory _functionSelectors,
    bytes4 interfaceId
  ) internal {
    require(_functionSelectors.length > 0, 'DiamondCut: No selectors in facet to cut');
    DiamondStorage storage ds = diamondStorage();
    uint16 selectorCount = uint16(ds.selectors.length);
    require(_facetAddress != address(0), 'DiamondCut: Add facet cannot be address(0)');
    enforceHasContractCode(_facetAddress, 'DiamondCut: Add facet has no code');

    for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
      bytes4 selector = _functionSelectors[selectorIndex];
      address oldFacetAddress = ds.facetAddressAndSelectorPosition[selector].facetAddress;
      require(oldFacetAddress == address(0), 'DiamondCut: Cannot add function that already exists');
      ds.facetAddressAndSelectorPosition[selector] = FacetAddressAndSelectorPosition(_facetAddress, selectorCount);
      ds.selectors.push(selector);
      selectorCount++;
    }

    if (interfaceId != 0x00) {
      ERC165Impl.setInterfaceSupported(interfaceId);
    }
  }

  function _replaceFunctions(address _facetAddress, bytes4[] memory _functionSelectors) private {
    require(_functionSelectors.length > 0, 'DiamondCut: No selectors in facet to cut');
    DiamondStorage storage ds = diamondStorage();
    require(_facetAddress != address(0), 'DiamondCut: Replace facet cannot be address(0)');
    enforceHasContractCode(_facetAddress, 'DiamondCut: Replace facet has no code');
    for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
      bytes4 selector = _functionSelectors[selectorIndex];
      address oldFacetAddress = ds.facetAddressAndSelectorPosition[selector].facetAddress;
      // can't replace immutable functions -- functions defined directly in the diamond
      require(oldFacetAddress != address(this), 'DiamondCut: Cannot replace immutable function');
      require(oldFacetAddress != _facetAddress, 'DiamondCut: Cannot replace function with same function');
      require(oldFacetAddress != address(0), 'DiamondCut: Cannot replace function that does not exist');
      // replace old facet address
      ds.facetAddressAndSelectorPosition[selector].facetAddress = _facetAddress;
    }
  }

  function _removeFunctions(
    address _facetAddress,
    bytes4[] memory _functionSelectors,
    bytes4 interfaceId
  ) internal {
    require(_functionSelectors.length > 0, 'DiamondCut: No selectors in facet to cut');
    DiamondStorage storage ds = diamondStorage();
    uint256 selectorCount = ds.selectors.length;
    require(_facetAddress == address(0), 'DiamondCut: Remove facet address must be address(0)');

    for (uint256 selectorIndex; selectorIndex < _functionSelectors.length; selectorIndex++) {
      bytes4 selector = _functionSelectors[selectorIndex];
      FacetAddressAndSelectorPosition memory oldFacetAddressAndSelectorPosition = ds.facetAddressAndSelectorPosition[
        selector
      ];

      require(
        oldFacetAddressAndSelectorPosition.facetAddress != address(0),
        'DiamondCut: Cannot remove function that does not exist'
      );

      // cannot remove immutable functions -- functions defined directly in the diamond
      require(
        oldFacetAddressAndSelectorPosition.facetAddress != address(this),
        'DiamondCut: Cannot remove immutable function.'
      );

      // replace selector with last selector
      selectorCount--;
      if (oldFacetAddressAndSelectorPosition.selectorPosition != selectorCount) {
        bytes4 lastSelector = ds.selectors[selectorCount];
        ds.selectors[oldFacetAddressAndSelectorPosition.selectorPosition] = lastSelector;
        ds.facetAddressAndSelectorPosition[lastSelector].selectorPosition = oldFacetAddressAndSelectorPosition
          .selectorPosition;
      }
      // delete last selector
      ds.selectors.pop();
      delete ds.facetAddressAndSelectorPosition[selector];
    }

    if (interfaceId != 0x00) {
      ERC165Impl.clearInterfaceSupported(interfaceId);
    }
  }

  function initializeDiamondCut(address initAddress, bytes memory callData) internal {
    if (initAddress == address(0)) {
      require(callData.length == 0, 'DiamondCut: init is address(0) but call data is not empty');
      return;
    }

    require(callData.length > 0, 'DiamondCut: call data is empty but init is not address(0)');
    if (initAddress != address(this)) {
      enforceHasContractCode(initAddress, 'DiamondCut: init address has no code');
    }

    // solhint-disable-next-line avoid-low-level-calls
    (bool success, bytes memory error) = initAddress.delegatecall(callData);
    if (success) {
      return;
    }

    if (error.length > 0) {
      // bubble up the error
      // solhint-disable-next-line no-inline-assembly
      assembly {
        let ptr := mload(0x40)
        let size := returndatasize()
        returndatacopy(ptr, 0, size)
        revert(ptr, size)
      }
    } else {
      revert('DiamondCut: init function reverted');
    }
  }

  function enforceHasContractCode(address initAddress, string memory errorMessage) internal view {
    uint256 contractSize;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      contractSize := extcodesize(initAddress)
    }
    require(contractSize > 0, errorMessage);
  }

  // have to redeclare here even though it's already declared in IDiamondCut
  event DiamondCut(IDiamondCut.FacetCut[] diamondCuts, IDiamondCut.DiamondInitFunction initFunction);
}
