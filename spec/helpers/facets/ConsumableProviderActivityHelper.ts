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

import { buildConsumableProviderActivityInitFunction } from '../../../src/contracts/activities/consumableProviderActivity';
import { ConsumableAmount } from '../../../src/contracts/consumables';
import { buildDiamondFacetCut } from '../../../src/contracts/diamonds';
import {
  ConsumableProviderActivityHooks__factory,
  ConsumableProviderActivityInit__factory,
} from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, ExtensibleDiamondOptions } from '../DiamondHelper';
import { createActivity } from './ActivityFacetHelper';
import { deployConsumableProviderFacet } from './ConsumableProviderFacetHelper';

export const createConsumableProviderActivity = async (
  providedConsumables: ConsumableAmount[] = [],
  options: ExtensibleDiamondOptions = {},
) =>
  createActivity(
    combineExtensibleDiamondOptions(await buildConsumableProviderActivityAdditions(providedConsumables), options),
  );

export const buildConsumableProviderActivityAdditions = async (
  providedConsumables: ConsumableAmount[] = [],
): Promise<ExtensibleDiamondOptions> => ({
  additionalCuts: [buildDiamondFacetCut(await deployConsumableProviderFacet())],
  additionalInits: [
    buildConsumableProviderActivityInitFunction(await deployConsumableProviderActivityInit(), {
      providedConsumables,
      consumableProviderActivityHooks: await deployConsumableProviderActivityHooks(),
    }),
  ],
});

export const deployConsumableProviderActivityHooks = () =>
  new ConsumableProviderActivityHooks__factory(INITIALIZER).deploy();
export const deployConsumableProviderActivityInit = () =>
  new ConsumableProviderActivityInit__factory(INITIALIZER).deploy();
