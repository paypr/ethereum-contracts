// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165Checker.sol';
import './IConvertibleConsumable.sol';

library ConvertibleConsumableInterfaceSupport {
  using ERC165Checker for address;

  bytes4 internal constant CONVERTIBLE_CONSUMABLE_INTERFACE_ID = 0x1574139e;

  function supportsConvertibleConsumableInterface(IConvertibleConsumable consumable) internal view returns (bool) {
    return address(consumable).supportsInterface(CONVERTIBLE_CONSUMABLE_INTERFACE_ID);
  }

  function calcConvertibleConsumableInterfaceId(IConvertibleConsumable consumable) internal pure returns (bytes4) {
    return
      consumable.exchangeToken.selector ^
      consumable.asymmetricalExchangeRate.selector ^
      consumable.intrinsicValueExchangeRate.selector ^
      consumable.purchasePriceExchangeRate.selector ^
      consumable.amountExchangeTokenAvailable.selector ^
      consumable.mintByExchange.selector ^
      consumable.amountExchangeTokenNeeded.selector ^
      consumable.burnByExchange.selector ^
      consumable.amountExchangeTokenProvided.selector;
  }
}
