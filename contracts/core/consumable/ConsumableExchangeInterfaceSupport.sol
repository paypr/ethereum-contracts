// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165Checker.sol';
import './IConsumableExchange.sol';

library ConsumableExchangeInterfaceSupport {
  using ERC165Checker for address;

  bytes4 internal constant CONSUMABLE_EXCHANGE_INTERFACE_ID = 0x03c613c0;

  function supportsConsumableExchangeInterface(IConsumableExchange exchange) internal view returns (bool) {
    return address(exchange).supportsInterface(CONSUMABLE_EXCHANGE_INTERFACE_ID);
  }

  function calcConsumableExchangeInterfaceId(IConsumableExchange exchange) internal pure returns (bytes4) {
    return
      exchange.totalConvertibles.selector ^
      exchange.convertibleAt.selector ^
      exchange.isConvertible.selector ^
      exchange.exchangeRateOf.selector ^
      exchange.exchangeTo.selector ^
      exchange.exchangeFrom.selector ^
      exchange.registerToken.selector;
  }
}
