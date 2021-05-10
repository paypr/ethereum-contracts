/*
 * Copyright (c) 2020 The Paypr Company, LLC
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

pragma solidity ^0.8.3;

import '@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol';
import '../BaseContract.sol';
import './ArtifactInterfaceSupport.sol';
import './IArtifact.sol';
import '../consumable/ConsumableProvider.sol';
import '../consumable/ConsumableProviderInterfaceSupport.sol';
import '../IDisableable.sol';
import '../transfer/TransferringInterfaceSupport.sol';
import '../transfer/TransferLogic.sol';
import '../transfer/ITransferring.sol';

abstract contract Artifact is
  IDisableable,
  Initializable,
  ContextUpgradeable,
  ITransferring,
  ERC165StorageUpgradeable,
  IArtifact,
  BaseContract,
  ConsumableProvider,
  ERC721Upgradeable
{
  using SafeMathUpgradeable for uint256;
  using TransferLogic for address;

  uint256 private _initialUses;
  string private _baseUri;

  mapping(uint256 => uint256) private _usesLeft;
  uint256 private _totalUsesLeft;

  function _initializeArtifact(
    ContractInfo memory info,
    string memory baseUri,
    string memory symbol,
    IConsumable.ConsumableAmount[] memory amountsToProvide,
    uint256 initialUses
  ) internal initializer {
    _initializeBaseContract(info);
    _initializeConsumableProvider(amountsToProvide);
    _registerInterface(ArtifactInterfaceSupport.ARTIFACT_INTERFACE_ID);
    _registerInterface(ConsumableProviderInterfaceSupport.CONSUMABLE_PROVIDER_INTERFACE_ID);

    __ERC721_init(info.name, symbol);
    _registerInterface(TransferringInterfaceSupport.TRANSFERRING_INTERFACE_ID);
    _baseUri = baseUri;

    _initialUses = initialUses;
  }

  /**
   * @dev Base URI for computing {tokenURI}.
   */
  function _baseURI() internal view virtual override returns (string memory) {
    return _baseUri;
  }

  function initialUses() external view override returns (uint256) {
    return _initialUses;
  }

  function usesLeft(uint256 itemId) external view override returns (uint256) {
    return _usesLeft[itemId];
  }

  function totalUsesLeft() external view override returns (uint256) {
    return _totalUsesLeft;
  }

  function useItem(uint256 itemId, address action) external override onlyEnabled {
    address sender = _msgSender();
    address player = ownerOf(itemId);

    require(sender == player, 'Artifact: must be used by the owner');

    _usesLeft[itemId] = _usesLeft[itemId].sub(1, 'Artifact: no uses left for item');
    _totalUsesLeft = _totalUsesLeft.sub(1);

    _provideConsumables(action);

    emit Used(player, action, itemId);
  }

  function _mint(address to, uint256 itemId) internal override onlyEnabled {
    super._mint(to, itemId);

    _usesLeft[itemId] = _initialUses;
    _totalUsesLeft += _initialUses;

    _checkEnoughConsumable();
  }

  function _checkEnoughConsumable() internal {
    require(_canProvideMultiple(_totalUsesLeft), 'Artifact: not enough consumable for items');
  }

  function onERC721Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes calldata data
  ) external virtual override returns (bytes4) {
    return TransferLogic.onERC721Received(operator, from, tokenId, data);
  }

  function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(IERC165Upgradeable, ERC721Upgradeable, ERC165StorageUpgradeable)
    returns (bool)
  {
    return ERC165StorageUpgradeable.supportsInterface(interfaceId);
  }

  uint256[50] private ______gap;
}
