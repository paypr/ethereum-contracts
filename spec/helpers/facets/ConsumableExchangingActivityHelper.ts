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

import { buildConsumableExchangingActivityInitFunction } from '../../../src/contracts/activities/consumableExchangingActivity';
import { ConsumableAmount } from '../../../src/contracts/consumables';
import { buildDiamondFacetCut } from '../../../src/contracts/core/diamonds';
import {
  ConsumableExchangingActivityHooks__factory,
  ConsumableExchangingActivityInit__factory,
  IConsumableExchange,
} from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, ExtensibleDiamondOptions } from '../DiamondHelper';
import { createActivity } from './ActivityFacetHelper';
import { deployConsumableConsumerFacet } from './ConsumableConsumerFacetHelper';
import { deployConsumableExchangingFacet } from './ConsumableExchangingFacetHelper';
import { deployConsumableProviderFacet } from './ConsumableProviderFacetHelper';

export const createConsumableExchangingActivity = async (
  exchange: IConsumableExchange,
  requiredConsumables: ConsumableAmount[] = [],
  providedConsumables: ConsumableAmount[] = [],
  options: ExtensibleDiamondOptions = {},
) =>
  createActivity(
    combineExtensibleDiamondOptions(
      await buildConsumableExchangingActivityAdditions(exchange, requiredConsumables, providedConsumables),
      options,
    ),
  );

export const buildConsumableExchangingActivityAdditions = async (
  exchange: IConsumableExchange,
  requiredConsumables: ConsumableAmount[] = [],
  providedConsumables: ConsumableAmount[] = [],
): Promise<ExtensibleDiamondOptions> => ({
  additionalCuts: [
    buildDiamondFacetCut(await deployConsumableConsumerFacet()),
    buildDiamondFacetCut(await deployConsumableExchangingFacet()),
    buildDiamondFacetCut(await deployConsumableProviderFacet()),
  ],
  additionalInits: [
    buildConsumableExchangingActivityInitFunction(await deployConsumableExchangingActivityInit(), {
      exchange,
      requiredConsumables,
      providedConsumables,
      consumableExchangingActivityHooks: await deployConsumableExchangingActivityHooks(),
    }),
  ],
});

export const deployConsumableExchangingActivityHooks = () =>
  new ConsumableExchangingActivityHooks__factory(INITIALIZER).deploy();
export const deployConsumableExchangingActivityInit = () =>
  new ConsumableExchangingActivityInit__factory(INITIALIZER).deploy();
