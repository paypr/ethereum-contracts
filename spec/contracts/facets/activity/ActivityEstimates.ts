/*
 * Copyright (c) 2022 The Paypr Company, LLC
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

import { buildConsumableConsumerActivityInitFunction } from '../../../../src/contracts/activities/consumableConsumerActivity';
import { buildConsumableExchangingActivityInitFunction } from '../../../../src/contracts/activities/consumableExchangingActivity';
import { buildConsumableProviderActivityInitFunction } from '../../../../src/contracts/activities/consumableProviderActivity';
import { buildSkillConstrainedActivityInitFunction } from '../../../../src/contracts/activities/skillConstrainedActivity';
import { buildDiamondFacetCut, emptyDiamondInitFunction } from '../../../../src/contracts/diamonds';
import { EstimateTest } from '../../../helpers/EstimateHelper';
import { deployActivityFacet } from '../../../helpers/facets/ActivityFacetHelper';
import {
  deployConsumableConsumerActivityHooks,
  deployConsumableConsumerActivityInit,
} from '../../../helpers/facets/ConsumableConsumerActivityHelper';
import { createConvertibleConsumable } from '../../../helpers/facets/ConsumableConversionFacetHelper';
import { createConsumableExchange } from '../../../helpers/facets/ConsumableExchangeFacetHelper';
import {
  deployConsumableExchangingActivityHooks,
  deployConsumableExchangingActivityInit,
} from '../../../helpers/facets/ConsumableExchangingActivityHelper';
import { createConsumable } from '../../../helpers/facets/ConsumableFacetHelper';
import {
  deployConsumableProviderActivityHooks,
  deployConsumableProviderActivityInit,
} from '../../../helpers/facets/ConsumableProviderActivityHelper';
import {
  deploySkillConstrainedActivityHooks,
  deploySkillConstrainedActivityInit,
} from '../../../helpers/facets/SkillConstrainedActivityHelper';
import { createSkill } from '../../../helpers/facets/SkillFacetHelper';

export const activityEstimateTests: EstimateTest[] = [
  [
    'ActivityFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployActivityFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    146355,
  ],
  [
    'ActivityFacet with consumable consumer hooks',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployActivityFacet())],
      initFunction: buildConsumableConsumerActivityInitFunction(await deployConsumableConsumerActivityInit(), {
        requiredConsumables: [],
        consumableConsumerActivityHooks: await deployConsumableConsumerActivityHooks(),
      }),
    }),
    223063,
  ],
  [
    'ActivityFacet with one required consumable',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployActivityFacet())],
      initFunction: buildConsumableConsumerActivityInitFunction(await deployConsumableConsumerActivityInit(), {
        requiredConsumables: [{ consumable: (await createConsumable()).address, amount: 1 }],
        consumableConsumerActivityHooks: await deployConsumableConsumerActivityHooks(),
      }),
    }),
    300091,
  ],
  [
    'ActivityFacet with two required consumables',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployActivityFacet())],
      initFunction: buildConsumableConsumerActivityInitFunction(await deployConsumableConsumerActivityInit(), {
        requiredConsumables: [
          { consumable: (await createConsumable()).address, amount: 1 },
          { consumable: (await createConsumable()).address, amount: 2 },
        ],
        consumableConsumerActivityHooks: await deployConsumableConsumerActivityHooks(),
      }),
    }),
    357240,
  ],
  [
    'ActivityFacet with consumable provider hooks',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployActivityFacet())],
      initFunction: buildConsumableProviderActivityInitFunction(await deployConsumableProviderActivityInit(), {
        providedConsumables: [],
        consumableProviderActivityHooks: await deployConsumableProviderActivityHooks(),
      }),
    }),
    223063,
  ],
  [
    'ActivityFacet with one provided consumable',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployActivityFacet())],
      initFunction: buildConsumableProviderActivityInitFunction(await deployConsumableProviderActivityInit(), {
        providedConsumables: [{ consumable: (await createConsumable()).address, amount: 1 }],
        consumableProviderActivityHooks: await deployConsumableProviderActivityHooks(),
      }),
    }),
    300091,
  ],
  [
    'ActivityFacet with two provided consumables',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployActivityFacet())],
      initFunction: buildConsumableProviderActivityInitFunction(await deployConsumableProviderActivityInit(), {
        providedConsumables: [
          { consumable: (await createConsumable()).address, amount: 1 },
          { consumable: (await createConsumable()).address, amount: 2 },
        ],
        consumableProviderActivityHooks: await deployConsumableProviderActivityHooks(),
      }),
    }),
    357228,
  ],
  [
    'ActivityFacet with consumable exchanging hooks',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployActivityFacet())],
      initFunction: buildConsumableExchangingActivityInitFunction(await deployConsumableExchangingActivityInit(), {
        requiredConsumables: [],
        providedConsumables: [],
        exchange: (await createConsumableExchange()).address,
        consumableExchangingActivityHooks: await deployConsumableExchangingActivityHooks(),
      }),
    }),
    264158,
  ],
  [
    'ActivityFacet with exchanging one required consumable and one provided consumable',
    async () => {
      const exchange = await createConsumableExchange();
      return {
        diamondCuts: [buildDiamondFacetCut(await deployActivityFacet())],
        initFunction: buildConsumableExchangingActivityInitFunction(await deployConsumableExchangingActivityInit(), {
          requiredConsumables: [
            {
              consumable: (await createConvertibleConsumable(exchange, { registerWithExchange: true })).address,
              amount: 1,
            },
          ],
          providedConsumables: [
            {
              consumable: (await createConvertibleConsumable(exchange, { registerWithExchange: true })).address,
              amount: 1,
            },
          ],
          exchange: exchange.address,
          consumableExchangingActivityHooks: await deployConsumableExchangingActivityHooks(),
        }),
      };
    },
    442305,
  ],
  [
    'ActivityFacet with exchanging two required consumables and two provided consumables',
    async () => {
      const exchange = await createConsumableExchange();
      return {
        diamondCuts: [buildDiamondFacetCut(await deployActivityFacet())],
        initFunction: buildConsumableExchangingActivityInitFunction(await deployConsumableExchangingActivityInit(), {
          requiredConsumables: [
            {
              consumable: (await createConvertibleConsumable(exchange, { registerWithExchange: true })).address,
              amount: 1,
            },
            {
              consumable: (await createConvertibleConsumable(exchange, { registerWithExchange: true })).address,
              amount: 2,
            },
          ],
          providedConsumables: [
            {
              consumable: (await createConvertibleConsumable(exchange, { registerWithExchange: true })).address,
              amount: 1,
            },
            {
              consumable: (await createConvertibleConsumable(exchange, { registerWithExchange: true })).address,
              amount: 2,
            },
          ],
          exchange: exchange.address,
          consumableExchangingActivityHooks: await deployConsumableExchangingActivityHooks(),
        }),
      };
    },
    574107,
  ],
  [
    'ActivityFacet with skill constrained hooks',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployActivityFacet())],
      initFunction: buildSkillConstrainedActivityInitFunction(await deploySkillConstrainedActivityInit(), {
        requiredSkills: [],
        skillConstrainedActivityHooks: await deploySkillConstrainedActivityHooks(),
      }),
    }),
    223063,
  ],
  [
    'ActivityFacet with one required skill',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployActivityFacet())],
      initFunction: buildSkillConstrainedActivityInitFunction(await deploySkillConstrainedActivityInit(), {
        requiredSkills: [{ skill: (await createSkill()).address, level: 1 }],
        skillConstrainedActivityHooks: await deploySkillConstrainedActivityHooks(),
      }),
    }),
    300103,
  ],
  [
    'ActivityFacet with two required skills',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployActivityFacet())],
      initFunction: buildSkillConstrainedActivityInitFunction(await deploySkillConstrainedActivityInit(), {
        requiredSkills: [
          { skill: (await createSkill()).address, level: 1 },
          { skill: (await createSkill()).address, level: 2 },
        ],
        skillConstrainedActivityHooks: await deploySkillConstrainedActivityHooks(),
      }),
    }),
    357240,
  ],
];
