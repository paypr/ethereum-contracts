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

import { Contract } from 'ethers';
import { Interface } from 'ethers/lib/utils';
import { AccessRoleMembers } from '../../src/contracts/access';
import { ZERO_ADDRESS } from '../../src/contracts/accounts';
import {
  buildDiamondFacetCut,
  buildDiamondInitFunction,
  DiamondFacetCut,
  DiamondFacetCutAction,
  DiamondInitFunction,
  emptyDiamondInitFunction,
} from '../../src/contracts/diamonds';
import {
  buildErc165SetSupportedInterfacesDiamondInitFunction,
  Erc165InterfaceId,
  NO_INTERFACE,
} from '../../src/contracts/erc165';
import { DIAMOND_CUTTER_ROLE } from '../../src/contracts/roles';
import {
  Diamond__factory,
  DiamondInit,
  ERC165Init,
  IAccessCheck__factory,
  IDiamondCut__factory,
} from '../../types/contracts';
import { DIAMOND_CUTTER, INITIALIZER } from './Accounts';
import {
  AccessControlInitOptions,
  asAccessControl,
  buildOneOfAccessControlInitFunction,
  deployAccessControlCheckFacet,
  deployAccessControlFacet,
  deployCombinedAccessFacet,
  deployDelegatingAccessCheckFacet,
  deployDelegatingAccessFacet,
  OneOfAccessControlInitOptions,
} from './facets/AccessControlFacetHelper';
import { deployDiamondCutFacet, deployDiamondInit } from './facets/DiamondFacetHelper';
import { deployErc165Facet, deployErc165Init } from './facets/ERC165FacetHelper';

export const deployDiamond = (
  diamondCuts: DiamondFacetCut[],
  initFunction: DiamondInitFunction = emptyDiamondInitFunction,
) =>
  new Diamond__factory(INITIALIZER).deploy({
    diamondCuts,
    initFunction,
  });

export interface CreateDiamondBaseOptions {
  additionalCuts?: DiamondFacetCut[];
  diamondInit?: DiamondInit;
  additionalInits?: DiamondInitFunction[];
  erc165Init?: ERC165Init;
  additionalInterfaceIds?: Erc165InterfaceId[];
}

export type CreateDiamondOptions = CreateDiamondBaseOptions & OneOfAccessControlInitOptions;

export const createDiamond = async (options: CreateDiamondOptions = {}) => {
  const erc165Init = options.erc165Init || (await deployErc165Init());
  const additionalInterfaceIds = options.additionalInterfaceIds;

  const initFunction = await combineDiamondInitFunctions(
    [
      await buildOneOfAccessControlInitFunction(options),
      ...(additionalInterfaceIds
        ? [buildErc165SetSupportedInterfacesDiamondInitFunction(erc165Init, additionalInterfaceIds)]
        : []),
      ...(options.additionalInits || []),
    ],
    options.diamondInit,
  );

  const delegating = 'delegate' in options;
  const diamond = await deployDiamond(
    [
      buildDiamondFacetCut(await deployErc165Facet()),
      buildDiamondFacetCut(delegating ? await deployDelegatingAccessFacet() : await deployAccessControlFacet()),
      buildDiamondFacetCut(
        delegating ? await deployDelegatingAccessCheckFacet() : await deployAccessControlCheckFacet(),
      ),
      buildDiamondFacetCut(await deployDiamondCutFacet()),
      ...(options.additionalCuts || []),
    ],
    initFunction,
  );

  if (!delegating) {
    await asAccessControl(diamond).grantRole(DIAMOND_CUTTER_ROLE, DIAMOND_CUTTER.address);
  }

  return diamond;
};

export type CreateDiamondWithCombinedAccessOptions = CreateDiamondBaseOptions & AccessControlInitOptions;

export const createDiamondWithCombinedAccess = async (options: CreateDiamondWithCombinedAccessOptions = {}) => {
  const removeHasRoleCut: DiamondFacetCut = {
    action: DiamondFacetCutAction.Remove,
    functionSelectors: [
      Interface.getSighash(
        IAccessCheck__factory.connect(ZERO_ADDRESS, INITIALIZER).interface.functions['hasRole(bytes32,address)'],
      ),
    ],
    facetAddress: ZERO_ADDRESS,
    interfaceId: NO_INTERFACE,
  };

  const additionalCuts = [
    removeHasRoleCut,
    buildDiamondFacetCut(await deployDelegatingAccessFacet()),
    buildDiamondFacetCut(await deployCombinedAccessFacet()),
    ...(options.additionalCuts || []),
  ];

  return createDiamond({ ...options, additionalCuts });
};

export const cutDiamond = (
  diamond: Contract,
  diamondCuts: DiamondFacetCut[],
  initFunction: DiamondInitFunction = emptyDiamondInitFunction,
) => IDiamondCut__factory.connect(diamond.address, INITIALIZER).diamondCut(diamondCuts, initFunction);

export const combineDiamondInitFunctions = async (
  initFunctions: DiamondInitFunction[],
  diamondInit?: DiamondInit,
): Promise<DiamondInitFunction> => {
  if (initFunctions.length === 0) {
    return emptyDiamondInitFunction;
  }

  if (initFunctions.length === 1) {
    return initFunctions[0];
  }

  const diamondInitContract = diamondInit || (await deployDiamondInit());

  return buildDiamondInitFunction(diamondInitContract, initFunctions);
};

export interface ExtensibleDiamondOptions {
  additionalCuts?: DiamondFacetCut[];
  additionalRoleMembers?: AccessRoleMembers[];
  additionalInits?: DiamondInitFunction[];
}

export const combineExtensibleDiamondOptions = (
  baseOptions: ExtensibleDiamondOptions,
  additionalOptions: ExtensibleDiamondOptions,
): ExtensibleDiamondOptions => ({
  additionalCuts: [...(baseOptions.additionalCuts || []), ...(additionalOptions.additionalCuts || [])],
  additionalRoleMembers: [
    ...(baseOptions.additionalRoleMembers || []),
    ...(additionalOptions.additionalRoleMembers || []),
  ],
  additionalInits: [...(baseOptions.additionalInits || []), ...(additionalOptions.additionalInits || [])],
});
