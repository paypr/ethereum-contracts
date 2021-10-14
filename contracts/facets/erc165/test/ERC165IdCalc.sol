/*
 * Copyright (c) 2020 The Paypr Company, LLC
 *
 * This file is part of Paypr Ethereum Contracts.
 *
 * Paypr Ethereum Contracts is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Paypr Ethereum Contracts is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Paypr Ethereum Contracts.  If not, see <https://www.gnu.org/licenses/>.
 */

// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.4;

import '@openzeppelin/contracts/utils/introspection/IERC165.sol';
import '../../access/IAccessControl.sol';
import '../../access/IAccessCheck.sol';
import '../../access/IDelegatingAccess.sol';
import '../../activity/IActivity.sol';
import '../../activity/activityExecutor/IActivityExecutor.sol';
import '../../artifact/IArtifact.sol';
import '../../artifact/IArtifactMintable.sol';
import '../../consumable/IConsumable.sol';
import '../../consumable/IConsumableMint.sol';
import '../../consumable/consumer/IConsumableConsumer.sol';
import '../../consumable/conversion/IConsumableConversion.sol';
import '../../consumable/exchange/IConsumableExchange.sol';
import '../../consumable/exchanging/IConsumableExchanging.sol';
import '../../consumable/limit/IConsumableLimit.sol';
import '../../consumable/limit/IConsumableLimiter.sol';
import '../../consumable/provider/IConsumableProvider.sol';
import '../../diamond/IDiamondCut.sol';
import '../../diamond/IDiamondLoupe.sol';
import '../../disableable/IDisableable.sol';
import '../../erc721/enumerable/IERC721Enumerable.sol';
import '../../erc721/IERC721.sol';
import '../../erc721/IERC721Burnable.sol';
import '../../erc721/IERC721Metadata.sol';
import '../../erc721/IERC721Mintable.sol';
import '../../erc721/IERC721TokenInfo.sol';
import '../../info/IContractInfo.sol';
import '../../skill/ISkill.sol';
import '../../skill/skillAcquirer/ISkillAcquirer.sol';
import '../../skill/ISkillSelfAcquisition.sol';
import '../../skill/skillConstrained/ISkillConstrained.sol';
import '../../transfer/ITransferring.sol';

/**
 * Idea comes from https://medium.com/coinmonks/ethereum-standard-erc165-explained-63b54ca0d273
 */
library ERC165IdCalc {
  function calcAccessControlInterfaceId() external pure returns (bytes4) {
    return type(IAccessControl).interfaceId;
  }

  function calcAccessCheckInterfaceId() external pure returns (bytes4) {
    return type(IAccessCheck).interfaceId;
  }

  function calcActivityInterfaceId() external pure returns (bytes4) {
    return type(IActivity).interfaceId;
  }

  function calcActivityExecutorInterfaceId() external pure returns (bytes4) {
    return type(IActivityExecutor).interfaceId;
  }

  function calcArtifactInterfaceId() external pure returns (bytes4) {
    return type(IArtifact).interfaceId;
  }

  function calcArtifactMintableInterfaceId() external pure returns (bytes4) {
    return type(IArtifactMintable).interfaceId;
  }

  function calcConsumableInterfaceId() external pure returns (bytes4) {
    return type(IConsumable).interfaceId;
  }

  function calcConsumableConsumerInterfaceId() external pure returns (bytes4) {
    return type(IConsumableConsumer).interfaceId;
  }

  function calcConsumableConversionInterfaceId() external pure returns (bytes4) {
    return type(IConsumableConversion).interfaceId;
  }

  function calcConsumableExchangeInterfaceId() external pure returns (bytes4) {
    return type(IConsumableExchange).interfaceId;
  }

  function calcConsumableExchangingInterfaceId() external pure returns (bytes4) {
    return type(IConsumableExchanging).interfaceId;
  }

  function calcConsumableLimitInterfaceId() external pure returns (bytes4) {
    return type(IConsumableLimit).interfaceId;
  }

  function calcConsumableLimiterInterfaceId() external pure returns (bytes4) {
    return type(IConsumableLimiter).interfaceId;
  }

  function calcConsumableMintInterfaceId() external pure returns (bytes4) {
    return type(IConsumableMint).interfaceId;
  }

  function calcConsumableProviderInterfaceId() external pure returns (bytes4) {
    return type(IConsumableProvider).interfaceId;
  }

  function calcContractInfoInterfaceId() external pure returns (bytes4) {
    return type(IContractInfo).interfaceId;
  }

  function calcDelegatingAccessInterfaceId() external pure returns (bytes4) {
    return type(IDelegatingAccess).interfaceId;
  }

  function calcDiamondCutInterfaceId() external pure returns (bytes4) {
    return type(IDiamondCut).interfaceId;
  }

  function calcDiamondLoupeInterfaceId() external pure returns (bytes4) {
    return type(IDiamondLoupe).interfaceId;
  }

  function calcDisableableInterfaceId() external pure returns (bytes4) {
    return type(IDisableable).interfaceId;
  }

  function calcERC165InterfaceId() external pure returns (bytes4) {
    return type(IERC165).interfaceId;
  }

  function calcERC721InterfaceId() external pure returns (bytes4) {
    return type(IERC721).interfaceId;
  }

  function calcERC721BurnableInterfaceId() external pure returns (bytes4) {
    return type(IERC721Burnable).interfaceId;
  }

  function calcERC721EnumerableInterfaceId() external pure returns (bytes4) {
    return type(IERC721Enumerable).interfaceId;
  }

  function calcERC721MetadataInterfaceId() external pure returns (bytes4) {
    return type(IERC721Metadata).interfaceId;
  }

  function calcERC721MintableInterfaceId() external pure returns (bytes4) {
    return type(IERC721Mintable).interfaceId;
  }

  function calcERC721TokenInfoInterfaceId() external pure returns (bytes4) {
    return type(IERC721TokenInfo).interfaceId;
  }

  function calcSkillInterfaceId() external pure returns (bytes4) {
    return type(ISkill).interfaceId;
  }

  function calcSkillAcquirerInterfaceId() external pure returns (bytes4) {
    return type(ISkillAcquirer).interfaceId;
  }

  function calcSkillSelfAcquisitionInterfaceId() external pure returns (bytes4) {
    return type(ISkillSelfAcquisition).interfaceId;
  }

  function calcTransferInterfaceId() external pure returns (bytes4) {
    return type(ITransferring).interfaceId;
  }

  function calcSkillConstrainedInterfaceId() external pure returns (bytes4) {
    return type(ISkillConstrained).interfaceId;
  }
}
