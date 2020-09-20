// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import './ExchangingActivity.sol';
import '../access/DelegatingRoles.sol';

contract ConfigurableExchangingActivity is ExchangingActivity, DelegatingRoles {
  function initializeExchangingActivity(
    ContractInfo memory info,
    IConsumable.ConsumableAmount[] memory amountsToConsume,
    IConsumable.ConsumableAmount[] memory amountsToProvide,
    IConsumableExchange exchange,
    IRoleDelegate roleDelegate
  ) public initializer {
    _initializeExchangingActivity(info, amountsToConsume, amountsToProvide, exchange);

    _addRoleDelegate(roleDelegate);
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
