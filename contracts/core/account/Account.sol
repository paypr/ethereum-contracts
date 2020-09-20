// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/IERC721.sol';
import '../transfer/BaseTransferring.sol';
import '../transfer/TransferringInterfaceSupport.sol';
import '../Disableable.sol';
import '../access/Roles.sol';
import '../access/RoleDelegateInterfaceSupport.sol';

contract Account is BaseTransferring, Roles, ERC165UpgradeSafe, Disableable {
  function initializeAccount(IRoleDelegate roleDelegate) public initializer {
    __ERC165_init();
    _registerInterface(RoleDelegateInterfaceSupport.ROLE_DELEGATE_INTERFACE_ID);
    _registerInterface(TransferringInterfaceSupport.TRANSFERRING_INTERFACE_ID);

    if (address(roleDelegate) != address(0)) {
      _addRoleDelegate(roleDelegate);
    } else {
      _addSuperAdmin(_msgSender());
      _addAdmin(_msgSender());
      _addTransferAgent(_msgSender());
    }
  }

  function transferToken(
    IERC20 token,
    uint256 amount,
    address recipient
  ) external override onlyTransferAgent onlyEnabled {
    _transferTokenWithExchange(token, amount, recipient);
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

  uint256[50] private ______gap;
}
