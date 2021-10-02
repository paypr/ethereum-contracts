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
import { AccessRoleMembers } from '../../../src/contracts/access';
import { ConsumableHooksLike } from '../../../src/contracts/consumables';
import { buildConsumableLimitInitFunction } from '../../../src/contracts/consumables/limit';
import { buildDiamondFacetCut, DiamondFacetCut, DiamondInitFunction } from '../../../src/contracts/diamonds';
import { LIMITER_ROLE } from '../../../src/contracts/roles';
import {
  ConsumableLimitConsumableHooks__factory,
  ConsumableLimiterFacet__factory,
  ConsumableLimitFacet,
  ConsumableLimitFacet__factory,
  ConsumableLimitInit,
  ConsumableLimitInit__factory,
  IConsumableLimit__factory,
  IConsumableLimiter__factory,
} from '../../../types/contracts';
import { CONSUMABLE_LIMITER, INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, ExtensibleDiamondOptions } from '../DiamondHelper';
import { createConsumable } from './ConsumableFacetHelper';

export const asConsumableLimit = (contract: Contract, signer: Signer = INITIALIZER) =>
  IConsumableLimit__factory.connect(contract.address, signer);

export const asConsumableLimiter = (contract: Contract, signer: Signer = CONSUMABLE_LIMITER) =>
  IConsumableLimiter__factory.connect(contract.address, signer);

export interface CreateLimitConsumableOptions {
  limitFacet?: ConsumableLimitFacet;
  limitInit?: ConsumableLimitInit;
  limitConsumableHooks?: ConsumableHooksLike;
  additionalCuts?: DiamondFacetCut[];
  additionalRoleMembers?: AccessRoleMembers[];
  additionalInits?: DiamondInitFunction[];
}

export const createLimitedConsumable = async (options: CreateLimitConsumableOptions = {}) => {
  const limitFacet = options.limitFacet || (await deployConsumableLimitFacet());
  const limitConsumableHooks = options.limitConsumableHooks || (await deployConsumableLimitConsumableHooks());
  const limitInit = options.limitInit || (await deployConsumableLimitInit());

  return asConsumableLimit(
    await createConsumable(
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [buildDiamondFacetCut(limitFacet)],
          additionalInits: [buildConsumableLimitInitFunction(limitInit, { limitConsumableHooks })],
        },
        options,
      ),
    ),
  );
};

export const buildLimiterConsumableAdditions = async (): Promise<ExtensibleDiamondOptions> => ({
  additionalCuts: [buildDiamondFacetCut(await deployConsumableLimiterFacet())],
  additionalRoleMembers: [{ role: LIMITER_ROLE, members: [CONSUMABLE_LIMITER.address] }],
});

export const deployConsumableLimitFacet = () => new ConsumableLimitFacet__factory(INITIALIZER).deploy();
export const deployConsumableLimitConsumableHooks = () =>
  new ConsumableLimitConsumableHooks__factory(INITIALIZER).deploy();
export const deployConsumableLimitInit = () => new ConsumableLimitInit__factory(INITIALIZER).deploy();
export const deployConsumableLimiterFacet = () => new ConsumableLimiterFacet__factory(INITIALIZER).deploy();
