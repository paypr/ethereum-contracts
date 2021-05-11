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

import { Contract, Signer } from 'ethers';
import { ConsumableAmount } from '../../../src/contracts/consumables';
import { buildSetProvidedConsumablesFunction } from '../../../src/contracts/consumables/provider';
import { buildDiamondFacetCut } from '../../../src/contracts/core/diamonds';
import { SUPER_ADMIN_ROLE } from '../../../src/contracts/roles';
import {
  ConsumableProviderFacet,
  ConsumableProviderFacet__factory,
  ConsumableProviderInit,
  ConsumableProviderInit__factory,
  IConsumableProvider__factory,
  TestConsumableProviderFacet__factory,
} from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, createDiamond, ExtensibleDiamondOptions } from '../DiamondHelper';

export const asConsumableProvider = (contract: Contract, signer: Signer = INITIALIZER) =>
  IConsumableProvider__factory.connect(contract.address, signer);

export const asTestConsumableProvider = (contract: Contract, signer: Signer = INITIALIZER) =>
  TestConsumableProviderFacet__factory.connect(contract.address, signer);

export interface CreateProviderConsumableOptions extends ExtensibleDiamondOptions {
  providerFacet?: ConsumableProviderFacet;
  providerInit?: ConsumableProviderInit;
}

export const createConsumableProvider = async (
  requiredConsumables: ConsumableAmount[],
  options: CreateProviderConsumableOptions = {},
) =>
  asConsumableProvider(
    await createDiamond(await buildConsumableProviderDiamondAdditions(requiredConsumables, options)),
  );

export const buildConsumableProviderDiamondAdditions = async (
  requiredConsumables: ConsumableAmount[],
  options: CreateProviderConsumableOptions = {},
) => {
  const providerFacet = options.providerFacet || (await deployConsumableProviderFacet());
  const providerInit = options.providerInit || (await deployConsumableProviderInit());

  return combineExtensibleDiamondOptions(
    {
      additionalCuts: [buildDiamondFacetCut(providerFacet)],
      additionalRoleAdmins: [{ role: SUPER_ADMIN_ROLE, admins: [INITIALIZER.address] }],
      additionalInits: [buildSetProvidedConsumablesFunction(providerInit, requiredConsumables)],
    },
    options,
  );
};

export const createTestConsumableProvider = async (providedConsumables: ConsumableAmount[]) =>
  asTestConsumableProvider(
    await createConsumableProvider(providedConsumables, {
      additionalCuts: [buildDiamondFacetCut(await deployTestConsumableProviderFacet())],
    }),
  );

export const deployConsumableProviderFacet = () => new ConsumableProviderFacet__factory(INITIALIZER).deploy();
export const deployConsumableProviderInit = () => new ConsumableProviderInit__factory(INITIALIZER).deploy();
export const deployTestConsumableProviderFacet = () => new TestConsumableProviderFacet__factory(INITIALIZER).deploy();
