// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

library RoleSupport {
  bytes32 public constant SUPER_ADMIN_ROLE = 0x00;
  bytes32 public constant MINTER_ROLE = keccak256('Minter');
  bytes32 public constant ADMIN_ROLE = keccak256('Admin');
  bytes32 public constant TRANSFER_AGENT_ROLE = keccak256('Transfer');
}
