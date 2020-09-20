// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import './Disableable.sol';

contract TestDisableable is Disableable {
  function disable() external override {
    _disable();
  }

  function enable() external override {
    _enable();
  }

  function requiresEnabled() external view onlyEnabled {
    require(true, 'Should never fail');
  }
}
