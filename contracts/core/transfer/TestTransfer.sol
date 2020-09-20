// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165.sol';
import './BaseTransferring.sol';
import './TransferringInterfaceSupport.sol';
import '../access/Roles.sol';
import '../Disableable.sol';

contract TestTransfer is BaseTransferring, ERC165UpgradeSafe, Disableable, Roles {
  function initializeTestTransfer() external initializer {
    _registerInterface(TransferringInterfaceSupport.TRANSFERRING_INTERFACE_ID);
    _addSuperAdmin(_msgSender());
    _addAdmin(_msgSender());
    _addTransferAgent(_msgSender());
  }

  function transferToken(
    IERC20 token,
    uint256 amount,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    _transferToken(token, amount, recipient);
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
