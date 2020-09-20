// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/IERC165.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/IERC721.sol';
import '../consumable/IConsumableProvider.sol';

interface IArtifact is IERC165, IERC721, IConsumableProvider {
  struct Item {
    IArtifact artifact;
    uint256 itemId;
  }

  /**
   * Emitted when an item is used
   *
   * @param player Address of the player who used the item
   * @param action Address of whatever the item was used for
   * @param itemId The item that was used
   */
  event Used(address indexed player, address indexed action, uint256 indexed itemId);

  /**
   * @dev Returns the number of uses that items start with
   */
  function initialUses() external view returns (uint256);

  /**
   * @dev Returns the number of uses left for the given item
   */
  function usesLeft(uint256 itemId) external view returns (uint256);

  /**
   * @dev Returns the number of uses left for all of the items in circulation
   */
  function totalUsesLeft() external view returns (uint256);

  /**
   * @dev Uses the given item for the given `action`.
   *
   * Emits a {Used} event.
   */
  function useItem(uint256 itemId, address action) external;
}
