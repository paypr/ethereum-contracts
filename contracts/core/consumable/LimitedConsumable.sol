// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol';
import './Consumable.sol';
import './LimitedConsumableInterfaceSupport.sol';
import './ILimitedConsumable.sol';

abstract contract LimitedConsumable is ILimitedConsumable, Consumable {
  using SafeMath for uint256;

  mapping(address => uint256) private _limits;

  function _initializeLimitedConsumable(ContractInfo memory info, string memory symbol) internal initializer {
    _initializeConsumable(info, symbol);
    _registerInterface(LimitedConsumableInterfaceSupport.LIMITED_CONSUMABLE_INTERFACE_ID);
  }

  function limitOf(address account) external override view returns (uint256) {
    return _limits[account];
  }

  function myLimit() external override view returns (uint256) {
    return _limits[_msgSender()];
  }

  /**
   * @dev Increases the limit for `account` by `addedValue`
   *
   * Emits a {Limited} event
   */
  function _increaseLimit(address account, uint256 addedValue) internal {
    _setLimit(account, _limits[account].add(addedValue));
  }

  /**
   * @dev Decreases the limit for `account` by `subtractedValue`
   *
   * Emits a {Limited} event
   */
  function _decreaseLimit(address account, uint256 subtractedValue) internal {
    _setLimit(account, _limits[account].sub(subtractedValue, 'LimitedConsumable: decreased limit below zero'));
  }

  /**
   * @dev Sets the limit for the `account` to `value`.
   */
  function _setLimit(address account, uint256 value) private onlyEnabled {
    require(account != address(0), 'LimitedConsumable: setLimit for the zero address');

    _limits[account] = value;
    emit Limited(account, value);
  }

  function _transfer(
    address sender,
    address recipient,
    uint256 amount
  ) internal override {
    super._transfer(sender, recipient, amount);

    _checkBalanceAgainstLimit(recipient);
  }

  function _mint(address account, uint256 amount) internal override {
    super._mint(account, amount);

    _checkBalanceAgainstLimit(account);
  }

  /**
   * @dev check the balance against the limit
   */
  function _checkBalanceAgainstLimit(address account) internal view {
    uint256 limit = _limits[account];
    if (limit > 0) {
      require(limit >= balanceOf(account), 'LimitedConsumable: account balance over the limit');
    }
  }

  uint256[50] private ______gap;
}