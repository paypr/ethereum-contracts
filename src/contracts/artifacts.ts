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

import { BigNumber } from 'ethers';
import { ArtifactInit, ERC721TokenInfoInit, IERC721Hooks } from '../../types/contracts';
import ContractAddress from './ContractAddress';
import { DiamondInitFunction } from './core/diamonds';
import { TransferHooksLike } from './transfer';

export interface Item {
  artifact: ContractAddress;
  itemId: string;
}

export interface ItemBN {
  artifact: ContractAddress;
  itemId: BigNumber;
}

export interface ArtifactData {
  initialUses: number;
  erc721Hooks: ERC721HooksLike;
  transferHooks: TransferHooksLike;
}

type ERC721HooksLike = IERC721Hooks;

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
