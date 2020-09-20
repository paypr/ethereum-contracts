// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import '@openzeppelin/contracts-ethereum-package/contracts/introspection/ERC165.sol';
import './IBaseContract.sol';
import './BaseContractInterfaceSupport.sol';

contract BaseContract is IBaseContract, ERC165UpgradeSafe {
  struct ContractInfo {
    string name;
    string description;
    string uri;
  }

  ContractInfo private _info;

  function _initializeBaseContract(ContractInfo memory info) internal initializer {
    __ERC165_init();
    _registerInterface(BaseContractInterfaceSupport.BASE_CONTRACT_INTERFACE_ID);

    _info = info;
  }

  function contractName() external override view returns (string memory) {
    return _info.name;
  }

  function contractDescription() external override view returns (string memory) {
    return _info.description;
  }

  function contractUri() external override view returns (string memory) {
    return _info.uri;
  }

  uint256[50] private ______gap;
}
