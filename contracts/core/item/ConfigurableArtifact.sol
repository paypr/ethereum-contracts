// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/utils/Counters.sol';
import './Artifact.sol';
import '../access/DelegatingRoles.sol';

contract ConfigurableArtifact is Artifact, DelegatingRoles {
  using Counters for Counters.Counter;

  Counters.Counter private _lastItemId;

  function initializeArtifact(
    ContractInfo memory info,
    string memory baseUri,
    string memory symbol,
    IConsumable.ConsumableAmount[] memory amountsToProvide,
    uint256 initialUses,
    IRoleDelegate roleDelegate
  ) public initializer {
    _initializeArtifact(info, baseUri, symbol, amountsToProvide, initialUses);

    _addRoleDelegate(roleDelegate);
  }

  function mint(address to) external onlyMinter returns (uint256) {
    _lastItemId.increment();
    uint256 itemId = _lastItemId.current();

    _mint(to, itemId);

    return itemId;
  }

  function transferToken(
    IERC20 token,
    uint256 amount,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    _transferToken(token, amount, recipient);
    _checkEnoughConsumable();
  }

  function transferItem(
    IERC721 artifact,
    uint256 itemId,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    _transferItem(artifact, itemId, recipient);
  }

  function disable() external override onlyAdmin {
    _disable();
  }

  function enable() external override onlyAdmin {
    _enable();
  }
}
