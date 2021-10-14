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
 * Implementation based on OpenZeppelin Contracts ERC721Enumerable:
 * https://openzeppelin.com/contracts/
 */

// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.4;

import '../IERC721.sol';

library ERC721EnumerableImpl {
  bytes32 private constant ERC721_ENUMERABLE_STORAGE_POSITION = keccak256('paypr.erc721Enumerable.storage');

  struct ERC721EnumerableStorage {
    // Mapping from owner to list of owned token IDs
    mapping(address => mapping(uint256 => uint256)) ownedTokens;
    // Mapping from token ID to index of the owner tokens list
    mapping(uint256 => uint256) ownedTokensIndex;
    // Array with all token ids, used for enumeration
    uint256[] allTokens;
    // Mapping from token id to position in the allTokens array
    mapping(uint256 => uint256) allTokensIndex;
  }

  //noinspection NoReturn
  function _erc721EnumerableStorage() private pure returns (ERC721EnumerableStorage storage ds) {
    bytes32 position = ERC721_ENUMERABLE_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function tokenOfOwnerByIndex(address owner, uint256 index) internal view returns (uint256) {
    require(index < IERC721(address(this)).balanceOf(owner), 'ERC721Enumerable: owner index out of bounds');
    return _erc721EnumerableStorage().ownedTokens[owner][index];
  }

  function totalSupply() internal view returns (uint256) {
    return _erc721EnumerableStorage().allTokens.length;
  }

  function tokenByIndex(uint256 index) internal view returns (uint256) {
    require(index < totalSupply(), 'ERC721Enumerable: global index out of bounds');
    return _erc721EnumerableStorage().allTokens[index];
  }

  /**
   * @dev Internal function to add a token to this extension's ownership-tracking data structures.
   * @param to address representing the new owner of the given token ID
   * @param tokenId uint256 ID of the token to be added to the tokens list of the given address
   */
  function addTokenToOwnerEnumeration(address to, uint256 tokenId) internal {
    uint256 length = IERC721(address(this)).balanceOf(to);

    ERC721EnumerableStorage storage ds = _erc721EnumerableStorage();
    ds.ownedTokens[to][length] = tokenId;
    ds.ownedTokensIndex[tokenId] = length;
  }

  /**
   * @dev Internal function to add a token to this extension's token tracking data structures.
   * @param tokenId uint256 ID of the token to be added to the tokens list
   */
  function addTokenToAllTokensEnumeration(uint256 tokenId) internal {
    ERC721EnumerableStorage storage ds = _erc721EnumerableStorage();
    ds.allTokensIndex[tokenId] = ds.allTokens.length;
    ds.allTokens.push(tokenId);
  }

  /**
   * @dev Internal function to remove a token from this extension's ownership-tracking data structures. Note that
   * while the token is not assigned a new owner, the `_ownedTokensIndex` mapping is _not_ updated: this allows for
   * gas optimizations e.g. when performing a transfer operation (avoiding double writes).
   * This has O(1) time complexity, but alters the order of the _ownedTokens array.
   * @param from address representing the previous owner of the given token ID
   * @param tokenId uint256 ID of the token to be removed from the tokens list of the given address
   */
  function removeTokenFromOwnerEnumeration(address from, uint256 tokenId) internal {
    // To prevent a gap in from's tokens array, we store the last token in the index of the token to delete, and
    // then delete the last slot (swap and pop).

    ERC721EnumerableStorage storage ds = _erc721EnumerableStorage();

    uint256 lastTokenIndex = IERC721(address(this)).balanceOf(from) - 1;
    uint256 tokenIndex = ds.ownedTokensIndex[tokenId];

    // When the token to delete is the last token, the swap operation is unnecessary
    if (tokenIndex != lastTokenIndex) {
      uint256 lastTokenId = ds.ownedTokens[from][lastTokenIndex];

      ds.ownedTokens[from][tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
      ds.ownedTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index
    }

    // This also deletes the contents at the last position of the array
    delete ds.ownedTokensIndex[tokenId];
    delete ds.ownedTokens[from][lastTokenIndex];
  }

  /**
   * @dev Internal function to remove a token from this extension's token tracking data structures.
   * This has O(1) time complexity, but alters the order of the allTokens array.
   * @param tokenId uint256 ID of the token to be removed from the tokens list
   */
  function removeTokenFromAllTokensEnumeration(uint256 tokenId) internal {
    // To prevent a gap in the tokens array, we store the last token in the index of the token to delete, and
    // then delete the last slot (swap and pop).

    ERC721EnumerableStorage storage ds = _erc721EnumerableStorage();

    uint256 lastTokenIndex = ds.allTokens.length - 1;
    uint256 tokenIndex = ds.allTokensIndex[tokenId];

    // When the token to delete is the last token, the swap operation is unnecessary. However, since this occurs so
    // rarely (when the last minted token is burnt) that we still do the swap here to avoid the gas cost of adding
    // an 'if' statement (like in _removeTokenFromOwnerEnumeration)
    uint256 lastTokenId = ds.allTokens[lastTokenIndex];

    ds.allTokens[tokenIndex] = lastTokenId; // Move the last token to the slot of the to-delete token
    ds.allTokensIndex[lastTokenId] = tokenIndex; // Update the moved token's index

    // This also deletes the contents at the last position of the array
    delete ds.allTokensIndex[tokenId];
    ds.allTokens.pop();
  }
}
