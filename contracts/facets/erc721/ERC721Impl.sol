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

/*
 * Implementation based on OpenZeppelin Contracts ERC721:
 * https://openzeppelin.com/contracts/
 */

import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import '@openzeppelin/contracts/utils/structs/EnumerableSet.sol';
import '@openzeppelin/contracts/utils/Address.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import '../../utils/HookUtils.sol';
import '../access/AccessCheckSupport.sol';
import '../access/RoleSupport.sol';
import '../context/ContextSupport.sol';
import './IERC721Hooks.sol';

library ERC721Impl {
  using Address for address;
  using EnumerableSet for EnumerableSet.AddressSet;
  using Strings for uint256;

  bytes32 private constant ERC721_STORAGE_POSITION = keccak256('paypr.erc721.storage');

  struct ERC721Storage {
    // base URI for token URI
    string baseUri;
    // whether or not to include the address in the token
    bool includeAddressInUri;
    // Mapping from token ID to owner address
    mapping(uint256 => address) owners;
    // Mapping owner address to token count
    mapping(address => uint256) balances;
    // Mapping from token ID to approved address
    mapping(uint256 => address) tokenApprovals;
    // Mapping from owner to operator approvals
    mapping(address => mapping(address => bool)) operatorApprovals;
    EnumerableSet.AddressSet hooks;
  }

  //noinspection NoReturn
  function _erc721Storage() private pure returns (ERC721Storage storage ds) {
    bytes32 position = ERC721_STORAGE_POSITION;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      ds.slot := position
    }
  }

  function checkMinter() internal view {
    AccessCheckSupport.checkRole(RoleSupport.MINTER_ROLE);
  }

  function balanceOf(address owner) internal view returns (uint256) {
    require(owner != address(0), 'ERC721: balance query for the zero address');
    return _erc721Storage().balances[owner];
  }

  function ownerOf(uint256 tokenId) internal view returns (address) {
    address owner = _erc721Storage().owners[tokenId];
    require(owner != address(0), 'ERC721: owner query for nonexistent token');
    return owner;
  }

  function tokenURI(uint256 tokenId) internal view returns (string memory) {
    require(_exists(tokenId), 'ERC721Metadata: URI query for nonexistent token');

    string storage _baseURI = baseURI();
    if (bytes(_baseURI).length == 0) {
      return '';
    }

    if (includeAddressInUri()) {
      return string(abi.encodePacked(_baseURI, Strings.toHexString(uint160(address(this))), '/', tokenId.toString()));
    }

    return string(abi.encodePacked(_baseURI, tokenId.toString()));
  }

  function baseURI() internal view returns (string storage) {
    return _erc721Storage().baseUri;
  }

  /**
   * @dev Base URI for computing {tokenURI}.
   */
  function setBaseURI(string memory _baseURI) internal {
    _erc721Storage().baseUri = _baseURI;
  }

  function includeAddressInUri() internal view returns (bool) {
    return _erc721Storage().includeAddressInUri;
  }

  function setIncludeAddressInUri(bool includeAddress) internal {
    _erc721Storage().includeAddressInUri = includeAddress;
  }

  function approve(address to, uint256 tokenId) internal {
    address owner = ownerOf(tokenId);
    require(to != owner, 'ERC721: approval to current owner');

    address msgSender = ContextSupport.msgSender();
    require(
      msgSender == owner || isApprovedForAll(owner, msgSender),
      'ERC721: approve caller is not owner nor approved for all'
    );

    _approve(to, tokenId);
  }

  function getApproved(uint256 tokenId) internal view returns (address) {
    require(_exists(tokenId), 'ERC721: approved query for nonexistent token');

    return _erc721Storage().tokenApprovals[tokenId];
  }

  function setApprovalForAll(address operator, bool approved) internal {
    address msgSender = ContextSupport.msgSender();
    require(operator != msgSender, 'ERC721: approve to caller');

    _erc721Storage().operatorApprovals[msgSender][operator] = approved;

    emit ApprovalForAll(msgSender, operator, approved);
  }

  function isApprovedForAll(address owner, address operator) internal view returns (bool) {
    return _erc721Storage().operatorApprovals[owner][operator];
  }

  function transferFrom(
    address from,
    address to,
    uint256 tokenId
  ) internal {
    require(
      _isApprovedOrOwner(ContextSupport.msgSender(), tokenId),
      'ERC721: transfer caller is not owner nor approved'
    );

    _transfer(from, to, tokenId);
  }

  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId
  ) internal {
    safeTransferFrom(from, to, tokenId, '');
  }

  function safeTransferFrom(
    address from,
    address to,
    uint256 tokenId,
    bytes memory _data
  ) internal {
    require(
      _isApprovedOrOwner(ContextSupport.msgSender(), tokenId),
      'ERC721: transfer caller is not owner nor approved'
    );
    _safeTransfer(from, to, tokenId, _data);
  }

  /**
   * @dev Safely transfers `tokenId` token from `from` to `to`, checking first that contract recipients
   * are aware of the ERC721 protocol to prevent tokens from being forever locked.
   *
   * `_data` is additional data, it has no specified format and it is sent in call to `to`.
   *
   * This internal function is equivalent to {safeTransferFrom}, and can be used to e.g.
   * implement alternative mechanisms to perform token transfer, such as signature-based.
   *
   * Requirements:
   *
   * - `from` cannot be the zero address.
   * - `to` cannot be the zero address.
   * - `tokenId` token must exist and be owned by `from`.
   * - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
   *
   * Emits a {Transfer} event.
   */
  function _safeTransfer(
    address from,
    address to,
    uint256 tokenId,
    bytes memory _data
  ) internal {
    _transfer(from, to, tokenId);
    require(_checkOnERC721Received(from, to, tokenId, _data), 'ERC721: transfer to non ERC721Receiver implementer');
  }

  /**
   * @dev Returns whether `tokenId` exists.
   *
   * Tokens can be managed by their owner or approved accounts via {approve} or {setApprovalForAll}.
   *
   * Tokens start existing when they are minted (`mint`),
   * and stop existing when they are burned (`burn`).
   */
  function _exists(uint256 tokenId) private view returns (bool) {
    return _erc721Storage().owners[tokenId] != address(0);
  }

  /**
   * @dev Returns whether `spender` is allowed to manage `tokenId`.
   *
   * Requirements:
   *
   * - `tokenId` must exist.
   */
  function _isApprovedOrOwner(address spender, uint256 tokenId) private view returns (bool) {
    require(_exists(tokenId), 'ERC721: operator query for nonexistent token');
    address owner = ownerOf(tokenId);
    return (spender == owner || getApproved(tokenId) == spender || isApprovedForAll(owner, spender));
  }

  function safeMint(address to, uint256 tokenId) internal {
    safeMint(to, tokenId, '');
  }

  /**
   * @dev Same as {xref-ERC721-_safeMint-address-uint256-}[`safeMint`], with an additional `data` parameter which is
   * forwarded in {IERC721Receiver-onERC721Received} to contract recipients.
   */
  function safeMint(
    address to,
    uint256 tokenId,
    bytes memory _data
  ) internal {
    mint(to, tokenId);
    require(
      _checkOnERC721Received(address(0), to, tokenId, _data),
      'ERC721: transfer to non ERC721Receiver implementer'
    );
  }

  //noinspection UnprotectedFunction
  function mint(address to, uint256 tokenId) internal {
    require(to != address(0), 'ERC721: mint to the zero address');
    require(!_exists(tokenId), 'ERC721: token already minted');

    _beforeTokenTransfer(address(0), to, tokenId);
    _beforeMint(to, tokenId);

    ERC721Storage storage ds = _erc721Storage();

    ds.balances[to] += 1;
    ds.owners[tokenId] = to;

    _afterTokenTransfer(address(0), to, tokenId);
    _afterMint(to, tokenId);

    emit Transfer(address(0), to, tokenId);
  }

  function burn(uint256 tokenId) internal {
    address owner = ownerOf(tokenId);

    _beforeTokenTransfer(owner, address(0), tokenId);
    _beforeBurn(owner, tokenId);

    // Clear approvals
    _approve(address(0), tokenId);

    ERC721Storage storage ds = _erc721Storage();

    ds.balances[owner] -= 1;
    delete ds.owners[tokenId];

    _afterTokenTransfer(owner, address(0), tokenId);
    _afterBurn(owner, tokenId);

    emit Transfer(owner, address(0), tokenId);
  }

  /**
   * @dev Transfers `tokenId` from `from` to `to`.
   *  As opposed to {transferFrom}, this imposes no restrictions on msg.sender.
   *
   * Requirements:
   *
   * - `to` cannot be the zero address.
   * - `tokenId` token must be owned by `from`.
   *
   * Emits a {Transfer} event.
   */
  //noinspection UnprotectedFunction
  function _transfer(
    address from,
    address to,
    uint256 tokenId
  ) internal {
    require(ownerOf(tokenId) == from, 'ERC721: transfer of token that is not own');
    require(to != address(0), 'ERC721: transfer to the zero address');

    _beforeTokenTransfer(from, to, tokenId);

    // Clear approvals from the previous owner
    _approve(address(0), tokenId);

    ERC721Storage storage ds = _erc721Storage();

    ds.balances[from] -= 1;
    ds.balances[to] += 1;
    ds.owners[tokenId] = to;

    _afterTokenTransfer(from, to, tokenId);

    emit Transfer(from, to, tokenId);
  }

  /**
   * @dev Approve `to` to operate on `tokenId`
   *
   * Emits a {Approval} event.
   */
  function _approve(address to, uint256 tokenId) private {
    _erc721Storage().tokenApprovals[tokenId] = to;

    emit Approval(ownerOf(tokenId), to, tokenId);
  }

  /**
   * @dev Internal function to invoke {IERC721Receiver-onERC721Received} on a target address.
   * The call is not executed if the target address is not a contract.
   *
   * @param from address representing the previous owner of the given token ID
   * @param to target address that will receive the tokens
   * @param tokenId uint256 ID of the token to be transferred
   * @param _data bytes optional data to send along with the call
   * @return bool whether the call correctly returned the expected magic value
   */
  //noinspection NoReturn
  function _checkOnERC721Received(
    address from,
    address to,
    uint256 tokenId,
    bytes memory _data
  ) internal returns (bool) {
    if (!to.isContract()) {
      return true;
    }

    try IERC721Receiver(to).onERC721Received(ContextSupport.msgSender(), from, tokenId, _data) returns (bytes4 retval) {
      return retval == IERC721Receiver(to).onERC721Received.selector;
    } catch (bytes memory reason) {
      if (reason.length == 0) {
        revert('ERC721: transfer to non ERC721Receiver implementer');
      } else {
        // solhint-disable-next-line no-inline-assembly
        assembly {
          revert(add(32, reason), mload(reason))
        }
      }
    }
  }

  function addHooks(IERC721Hooks artifactHooks) internal {
    require(address(artifactHooks) != address(0), 'ERC721: adding hook of the zero address');

    _erc721Storage().hooks.add(address(artifactHooks));
  }

  function removeHooks(IERC721Hooks artifactHooks) internal {
    require(address(artifactHooks) != address(0), 'ERC721: removing hook of the zero address');

    _erc721Storage().hooks.remove(address(artifactHooks));
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal {
    bytes memory callData = abi.encodeWithSelector(IERC721Hooks.beforeTokenTransfer.selector, from, to, tokenId);
    _executeHooks(callData);
  }

  function _afterTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal {
    bytes memory callData = abi.encodeWithSelector(IERC721Hooks.afterTokenTransfer.selector, from, to, tokenId);
    _executeHooks(callData);
  }

  function _beforeMint(address account, uint256 tokenId) private {
    bytes memory callData = abi.encodeWithSelector(IERC721Hooks.beforeMint.selector, account, tokenId);
    _executeHooks(callData);
  }

  function _afterMint(address account, uint256 tokenId) private {
    bytes memory callData = abi.encodeWithSelector(IERC721Hooks.afterMint.selector, account, tokenId);
    _executeHooks(callData);
  }

  function _beforeBurn(address account, uint256 tokenId) private {
    bytes memory callData = abi.encodeWithSelector(IERC721Hooks.beforeBurn.selector, account, tokenId);
    _executeHooks(callData);
  }

  function _afterBurn(address account, uint256 tokenId) private {
    bytes memory callData = abi.encodeWithSelector(IERC721Hooks.afterBurn.selector, account, tokenId);
    _executeHooks(callData);
  }

  function _executeHooks(bytes memory callData) private {
    EnumerableSet.AddressSet storage hooks = _erc721Storage().hooks;
    HookUtils.executeHooks(hooks, callData);
  }

  // have to redeclare here even though they are already declared in IERC721
  event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
  event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
  event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
}
