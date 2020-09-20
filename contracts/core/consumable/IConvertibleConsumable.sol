// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import './IConsumable.sol';

interface IConvertibleConsumable is IConsumable {
  /**
   * @dev the token that can be exchanged to/from
   */
  function exchangeToken() external view returns (IERC20);

  /**
   * @dev the amount that 1 of `exchangeToken` will convert into this consumable
   *
   * eg if `exchnageRate` is 1000, then 1000 this == 1 `conversionToken`
   */
  function exchangeRate() external view returns (uint256);

  /**
   * @dev amount of exchange token available, given total supply
   */
  function amountExchangeTokenAvailable() external view returns (uint256);

  /**
   * @dev mint `amount` tokens by converting from `exchangeToken`
   */
  function mintByExchange(uint256 amount) external;

  /**
   * @dev amount of exchange token needed to mint the given amount of consumable
   */
  function amountExchangeTokenNeeded(uint256 amount) external view returns (uint256);

  /**
   * @dev burn `amount` tokens by converting to `exchangeToken`
   */
  function burnByExchange(uint256 amount) external;

  /**
   * @dev amount of exchange token provided by burning the given amount of consumable
   */
  function amountExchangeTokenProvided(uint256 amount) external view returns (uint256);
}
