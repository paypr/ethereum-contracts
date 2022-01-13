/*
 * Copyright (c) 2021 The Paypr Company, LLC
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

import { ArtifactInit, ERC721Init, ERC721TokenInfoInit, IERC721Hooks } from '../../types/contracts';
import { IArtifact } from '../../types/contracts/IActivityExecutor';
import { LikeInterface } from './interfaces';
import ContractAddress from './ContractAddress';
import { DiamondInitFunction } from './diamonds';
import { TransferHooksLike } from './transfer';

export interface Item {
  artifact: ContractAddress;
  itemId: string;
}

export type ItemBN = IArtifact.ItemStruct;

export interface ArtifactData {
  initialUses: number;
  erc721Hooks: ERC721HooksLike;
  transferHooks: TransferHooksLike;
}

type ERC721HooksLike = LikeInterface<IERC721Hooks>;

export const buildArtifactInitFunction = (init: ArtifactInit, initData: ArtifactData): DiamondInitFunction => ({
  initAddress: init.address,
  callData: encodeArtifactInitCallData(init, initData),
});

export const encodeArtifactInitCallData = (init: ArtifactInit, initData: ArtifactData) =>
  init.interface.encodeFunctionData('initialize', [
    {
      initialUses: initData.initialUses,
      erc721Hooks: initData.erc721Hooks.address,
      transferHooks: initData.transferHooks.address,
    },
  ]);

export const buildERC721TokenInfoSetBaseUriInitFunction = (
  erc721TokenInfoInit: ERC721TokenInfoInit,
  baseUri: string,
): DiamondInitFunction => ({
  initAddress: erc721TokenInfoInit.address,
  callData: encodeERC721TokenInfoSetBaseUriCallData(erc721TokenInfoInit, baseUri),
});

export const encodeERC721TokenInfoSetBaseUriCallData = (erc721TokenInfoInit: ERC721TokenInfoInit, baseURI: string) =>
  erc721TokenInfoInit.interface.encodeFunctionData('setBaseURI', [baseURI]);

export const buildERC721TokenInfoSetIncludeAddressInUriInitFunction = (
  erc721TokenInfoInit: ERC721TokenInfoInit,
  includeAddress: boolean,
): DiamondInitFunction => ({
  initAddress: erc721TokenInfoInit.address,
  callData: encodeERC721TokenInfoSetIncludeAddressInUriCallData(erc721TokenInfoInit, includeAddress),
});

export const encodeERC721TokenInfoSetIncludeAddressInUriCallData = (
  erc721TokenInfoInit: ERC721TokenInfoInit,
  includeAddress: boolean,
) => erc721TokenInfoInit.interface.encodeFunctionData('setIncludeAddressInUri', [includeAddress]);

export const buildERC721TokenInfoInitFunction = (
  erc721TokenInfoInit: ERC721TokenInfoInit,
  baseUri: string,
  includeAddress: boolean = false,
): DiamondInitFunction => ({
  initAddress: erc721TokenInfoInit.address,
  callData: encodeERC721TokenInfoInitCallData(erc721TokenInfoInit, baseUri, includeAddress),
});

export const encodeERC721TokenInfoInitCallData = (
  erc721TokenInfoInit: ERC721TokenInfoInit,
  baseURI: string,
  includeAddress: boolean = false,
) => erc721TokenInfoInit.interface.encodeFunctionData('initialize', [baseURI, includeAddress]);

export const buildERC721AddHooksInitFunction = (
  erc721Init: ERC721Init,
  hooks: ERC721HooksLike,
): DiamondInitFunction => ({
  initAddress: erc721Init.address,
  callData: encodeERC721AddHooksCallData(erc721Init, hooks),
});

export const encodeERC721AddHooksCallData = (erc721Init: ERC721Init, hooks: ERC721HooksLike) =>
  erc721Init.interface.encodeFunctionData('addHooks', [hooks.address]);

export const buildERC721RemoveHooksInitFunction = (
  erc721Init: ERC721Init,
  hooks: IERC721Hooks,
): DiamondInitFunction => ({
  initAddress: erc721Init.address,
  callData: encodeERC721RemoveHooksCallData(erc721Init, hooks),
});

export const encodeERC721RemoveHooksCallData = (erc721Init: ERC721Init, hooks: ERC721HooksLike) =>
  erc721Init.interface.encodeFunctionData('removeHooks', [hooks.address]);
