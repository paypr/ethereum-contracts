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

import { buildConsumableConsumerActivityInitFunction } from '../../../src/contracts/activities/consumableConsumerActivity';
import { ConsumableAmount } from '../../../src/contracts/consumables';
import { buildDiamondFacetCut } from '../../../src/contracts/core/diamonds';
import {
  ConsumableConsumerActivityHooks__factory,
  ConsumableConsumerActivityInit__factory,
} from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, ExtensibleDiamondOptions } from '../DiamondHelper';
import { createActivity } from './ActivityFacetHelper';
import { deployConsumableConsumerFacet } from './ConsumableConsumerFacetHelper';

export const createConsumableConsumerActivity = async (
  requiredConsumables: ConsumableAmount[] = [],
  options: ExtensibleDiamondOptions = {},
) =>
  createActivity(
    combineExtensibleDiamondOptions(await buildConsumableConsumerActivityAdditions(requiredConsumables), options),
  );

export const buildConsumableConsumerActivityAdditions = async (
  requiredConsumables: ConsumableAmount[] = [],
): Promise<ExtensibleDiamondOptions> => ({
  additionalCuts: [buildDiamondFacetCut(await deployConsumableConsumerFacet())],
  additionalInits: [
    buildConsumableConsumerActivityInitFunction(await deployConsumableConsumerActivityInit(), {
      requiredConsumables,
      consumableConsumerActivityHooks: await deployConsumableConsumerActivityHooks(),
    }),
  ],
});

export const deployConsumableConsumerActivityHooks = () =>
  new ConsumableConsumerActivityHooks__factory(INITIALIZER).deploy();
export const deployConsumableConsumerActivityInit = () =>
  new ConsumableConsumerActivityInit__factory(INITIALIZER).deploy();
