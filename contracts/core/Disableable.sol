// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

abstract contract Disableable {
  bool private _disabled;

  /**
   * @dev Returns whether or not the contract is disabled
   */
  function disabled() external view returns (bool) {
    return _disabled;
  }

  /**
   * @dev Returns whether or not the contract is enabled
   */
  function enabled() external view returns (bool) {
    return !_disabled;
  }

  modifier onlyEnabled() {
    require(!_disabled, 'Contract is disabled');
    _;
  }

  /**
   * @dev Disables the contract
   */
  function disable() external virtual;

  /**
   * @dev Disables the contract
   */
  function _disable() internal {
    if (_disabled) {
      return;
    }

    _disabled = true;
    emit Disabled();
  }

  /**
   * @dev Enables the contract
   */
  function enable() external virtual;

  /**
   * @dev Enables the contract
   */
  function _enable() internal {
    if (!_disabled) {
      return;
    }

    _disabled = false;
    emit Enabled();
  }

  /**
   * Emitted when the contract is disabled
   */
  event Disabled();

  /**
   * Emitted when the contract is enabled
   */
  event Enabled();

  uint256[50] private ______gap;
}
