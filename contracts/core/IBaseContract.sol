// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/IERC165.sol';

interface IBaseContract is IERC165 {
  function contractName() external view returns (string memory);

  function contractDescription() external view returns (string memory);

  function contractUri() external view returns (string memory);
}
