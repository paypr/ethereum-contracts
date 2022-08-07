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

import { arrayify } from '@ethersproject/bytes';
import { Contract } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { DiamondInit, IDiamondCut } from '../../types/contracts';
import { IDiamondCut as IDiamondCutNamespace } from '../../types/contracts/contracts/facets/diamond/DiamondCutFacet';
import { ZERO_ADDRESS } from './accounts';

export interface DiamondConstructorParams {
  diamondCuts: DiamondFacetCut[];
  initFunction: DiamondInitFunction;
}

export type DiamondFacetCut = IDiamondCut.FacetCutStruct;

export enum DiamondFacetCutAction {
  Add,
  Replace,
  Remove,
}

export type DiamondInitFunction = IDiamondCutNamespace.DiamondInitFunctionStruct;

export const emptyDiamondInitFunction: DiamondInitFunction = { initAddress: ZERO_ADDRESS, callData: [] };

export const buildDiamondFacetCut = (
  facet: Contract,
  action: DiamondFacetCutAction = DiamondFacetCutAction.Add,
): DiamondFacetCut => {
  const allFunctionSelectors = getAllFunctionSelectors(facet);
  return {
    action,
    facetAddress: action === DiamondFacetCutAction.Remove ? ZERO_ADDRESS : facet.address,
    functionSelectors: allFunctionSelectors,
    interfaceId: allFunctionSelectors
      .map((value: string) => arrayify(value))
      .reduce((interfaceId: Uint8Array, functionSelector: Uint8Array) => {
        for (let i = 0; i < interfaceId.length; i += 1) {
          interfaceId[i] = interfaceId[i] ^ functionSelector[i];
        }
        return interfaceId;
      }, arrayify('0x00000000')),
  };
};

export const getAllFunctionSelectors = function (contract: Contract) {
  return Object.values(contract.interface.functions).map(Interface.getSighash);
};

export const buildDiamondInitFunction = (
  diamondInit: DiamondInit,
  initFunctions: DiamondInitFunction[],
): DiamondInitFunction => ({
  initAddress: diamondInit.address,
  callData: encodeDiamondInitCallData(diamondInit, initFunctions),
});

export const encodeDiamondInitCallData = (diamondInit: DiamondInit, initFunctions: DiamondInitFunction[]) =>
  diamondInit.interface.encodeFunctionData('initializeDiamond', [initFunctions]);
