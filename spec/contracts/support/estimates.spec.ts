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
import {
  buildAccessControlInitAdminsInitFunction,
  buildDelegatingAccessAddDelegateInitFunction,
} from '../../../src/contracts/access';
import { buildConsumableConsumerActivityInitFunction } from '../../../src/contracts/activities/consumableConsumerActivity';
import { buildConsumableExchangingActivityInitFunction } from '../../../src/contracts/activities/consumableExchangingActivity';
import { buildConsumableProviderActivityInitFunction } from '../../../src/contracts/activities/consumableProviderActivity';
import { buildSkillConstrainedActivityInitFunction } from '../../../src/contracts/activities/skillConstrainedActivity';
import {
  buildArtifactInitFunction,
  buildERC721AddHooksInitFunction,
  buildERC721TokenInfoSetBaseUriInitFunction,
} from '../../../src/contracts/artifacts';
import { buildSetRequiredConsumablesFunction } from '../../../src/contracts/consumables/consumer';
import { buildConsumableConversionInitFunction } from '../../../src/contracts/consumables/conversion';
import { buildConsumableExchangingInitFunction } from '../../../src/contracts/consumables/exchanging';
import { buildConsumableLimitInitFunction } from '../../../src/contracts/consumables/limit';
import { buildSetProvidedConsumablesFunction } from '../../../src/contracts/consumables/provider';
import { buildContractInfoInitializeInitFunction } from '../../../src/contracts/contractInfo';
import {
  buildDiamondFacetCut,
  buildDiamondInitFunction,
  DiamondConstructorParams,
  emptyDiamondInitFunction,
} from '../../../src/contracts/diamonds';
import { buildSetRequiredSkillsFunction } from '../../../src/contracts/skills/skillConstrained';
import { buildSkillConstrainedSkillInitFunction } from '../../../src/contracts/skills/skillConstrainedSkill';
import { Diamond__factory } from '../../../types/contracts';
import { INITIALIZER } from '../../helpers/Accounts';
import {
  createAccessControl,
  deployAccessControlCheckFacet,
  deployAccessControlFacet,
  deployAccessControlInit,
  deployCombinedAccessFacet,
  deployDelegatingAccessCheckFacet,
  deployDelegatingAccessFacet,
  deployDelegatingAccessInit,
} from '../../helpers/facets/AccessControlFacetHelper';
import { deployActivityExecutorFacet } from '../../helpers/facets/ActivityExecutorHelper';
import { deployActivityFacet } from '../../helpers/facets/ActivityFacetHelper';
import {
  deployArtifactERC721Hooks,
  deployArtifactFacet,
  deployArtifactInit,
  deployArtifactMintFacet,
  deployArtifactTransferHooks,
} from '../../helpers/facets/ArtifactFacetHelper';
import {
  deployConsumableConsumerActivityHooks,
  deployConsumableConsumerActivityInit,
} from '../../helpers/facets/ConsumableConsumerActivityHelper';
import {
  deployConsumableConsumerFacet,
  deployConsumableConsumerInit,
} from '../../helpers/facets/ConsumableConsumerFacetHelper';
import {
  createConvertibleConsumable,
  deployConsumableConversionConsumableHooks,
  deployConsumableConversionFacet,
  deployConsumableConversionInit,
  deployConsumableConversionTransferHooks,
} from '../../helpers/facets/ConsumableConversionFacetHelper';
import { createConsumableExchange } from '../../helpers/facets/ConsumableExchangeFacetHelper';
import {
  deployConsumableExchangingActivityHooks,
  deployConsumableExchangingActivityInit,
} from '../../helpers/facets/ConsumableExchangingActivityHelper';
import {
  deployConsumableExchangingFacet,
  deployConsumableExchangingInit,
} from '../../helpers/facets/ConsumableExchangingFacetHelper';
import {
  createConsumable,
  deployConsumableFacet,
  deployConsumableMintFacet,
} from '../../helpers/facets/ConsumableFacetHelper';
import {
  deployConsumableLimitConsumableHooks,
  deployConsumableLimiterFacet,
  deployConsumableLimitFacet,
  deployConsumableLimitInit,
} from '../../helpers/facets/ConsumableLimitFacetHelper';
import {
  deployConsumableProviderActivityHooks,
  deployConsumableProviderActivityInit,
} from '../../helpers/facets/ConsumableProviderActivityHelper';
import {
  deployConsumableProviderFacet,
  deployConsumableProviderInit,
} from '../../helpers/facets/ConsumableProviderFacetHelper';
import { deployContractInfoFacet, deployContractInfoInit } from '../../helpers/facets/ContractInfoFacetHelper';
import {
  deployDiamondCutFacet,
  deployDiamondInit,
  deployDiamondLoupeFacet,
} from '../../helpers/facets/DiamondFacetHelper';
import { deployDisableableFacet } from '../../helpers/facets/DisableableFacetHelper';
import { deployErc165Facet } from '../../helpers/facets/ERC165FacetHelper';
import {
  deployERC721BurnFacet,
  deployERC721EnumerableFacet,
  deployERC721EnumerableHooks,
  deployERC721Facet,
  deployERC721Init,
  deployERC721MintFacet,
  deployERC721TokenInfoFacet,
  deployERC721TokenInfoInit,
} from '../../helpers/facets/ERC721FacetHelper';
import { deploySkillAcquirerFacet } from '../../helpers/facets/SkillAcquirerHelper';
import {
  deploySkillConstrainedActivityHooks,
  deploySkillConstrainedActivityInit,
} from '../../helpers/facets/SkillConstrainedActivityHelper';
import {
  deploySkillConstrainedFacet,
  deploySkillConstrainedInit,
} from '../../helpers/facets/SkillConstrainedFacetHelper';
import {
  deploySkillConstrainedSkillHooks,
  deploySkillConstrainedSkillInit,
} from '../../helpers/facets/SkillConstrainedSkillHelper';
import { createSkill, deploySkillFacet, deploySkillSelfAcquisitionFacet } from '../../helpers/facets/SkillFacetHelper';
import { deployTransferFacet } from '../../helpers/facets/TransferFacetHelper';
import { ROLE1, ROLE2 } from '../../helpers/RoleIds';

const baseDiamondEstimate = 1282807;
const singleFunctionFacetEstimate = 97847;

type EstimateTest = [string, () => Promise<DiamondConstructorParams> | DiamondConstructorParams, number];
const estimateTests: EstimateTest[] = [
  [
    'AccessControlCheckFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployAccessControlCheckFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'AccessControlFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployAccessControlFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    194851,
  ],
  [
    'AccessControlFacet with single role',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployAccessControlFacet())],
      initFunction: buildAccessControlInitAdminsInitFunction(await deployAccessControlInit(), [ROLE1]),
    }),
    225894,
  ],
  [
    'AccessControlFacet with two roles',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployAccessControlFacet())],
      initFunction: buildAccessControlInitAdminsInitFunction(await deployAccessControlInit(), [ROLE1, ROLE2]),
    }),
    251157,
  ],
  [
    'DelegatingAccessCheckFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployDelegatingAccessCheckFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'DelegatingAccessFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployDelegatingAccessFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    146355,
  ],
  [
    'DelegatingAccessFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployDelegatingAccessFacet())],
      initFunction: buildDelegatingAccessAddDelegateInitFunction(
        await deployDelegatingAccessInit(),
        (await createAccessControl()).address,
      ),
    }),
    230407,
  ],
  [
    'CombinedAccessFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployCombinedAccessFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'ActivityExecutorFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployActivityExecutorFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
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
  [
    'ArtifactFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployArtifactFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    170609,
  ],
  [
    'ArtifactFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployArtifactFacet())],
      initFunction: buildArtifactInitFunction(await deployArtifactInit(), {
        erc721Hooks: await deployArtifactERC721Hooks(),
        transferHooks: await deployArtifactTransferHooks(),
        initialUses: 1,
      }),
    }),
    333320,
  ],
  [
    'ArtifactMintFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployArtifactMintFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'ConsumableFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    362225,
  ],
  [
    'ConsumableConversionFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConversionFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    313729,
  ],
  [
    'ConsumableConversionFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConversionFacet())],
      initFunction: buildConsumableConversionInitFunction(await deployConsumableConversionInit(), {
        exchangeToken: (await createConsumableExchange()).address,
        conversionConsumableHooks: await deployConsumableConversionConsumableHooks(),
        conversionTransferHooks: await deployConsumableConversionTransferHooks(),
        intrinsicValueExchangeRate: 1,
        purchasePriceExchangeRate: 1,
        registerWithExchange: false,
      }),
    }),
    523196,
  ],
  [
    'ConsumableConversionFacet registering with exchange',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConversionFacet())],
      initFunction: buildConsumableConversionInitFunction(await deployConsumableConversionInit(), {
        exchangeToken: (await createConsumableExchange()).address,
        conversionConsumableHooks: await deployConsumableConversionConsumableHooks(),
        conversionTransferHooks: await deployConsumableConversionTransferHooks(),
        intrinsicValueExchangeRate: 1,
        purchasePriceExchangeRate: 1,
        registerWithExchange: true,
      }),
    }),
    645282,
  ],
  [
    'ConsumableConversionFacet registering with exchange with asynchronous conversion',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConversionFacet())],
      initFunction: buildConsumableConversionInitFunction(await deployConsumableConversionInit(), {
        exchangeToken: (await createConsumableExchange()).address,
        conversionConsumableHooks: await deployConsumableConversionConsumableHooks(),
        conversionTransferHooks: await deployConsumableConversionTransferHooks(),
        intrinsicValueExchangeRate: 10,
        purchasePriceExchangeRate: 1,
        registerWithExchange: true,
      }),
    }),
    645294,
  ],
  [
    'ConsumableExchangingFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableExchangingFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    122089,
  ],
  [
    'ConsumableExchangingFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableExchangingFacet())],
      initFunction: buildConsumableExchangingInitFunction(await deployConsumableExchangingInit(), {
        exchange: (await createConsumableExchange()).address,
        requiredConsumables: [],
        providedConsumables: [],
      }),
    }),
    172066,
  ],
  [
    'ConsumableExchangingFacet with one required consumable and one provided consumable',
    async () => {
      const exchange = await createConsumableExchange();
      return {
        diamondCuts: [buildDiamondFacetCut(await deployConsumableExchangingFacet())],
        initFunction: buildConsumableExchangingInitFunction(await deployConsumableExchangingInit(), {
          exchange: exchange.address,
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
        }),
      };
    },
    350157,
  ],
  [
    'ConsumableExchangingFacet with two required consumables and two provided consumables',
    async () => {
      const exchange = await createConsumableExchange();
      return {
        diamondCuts: [buildDiamondFacetCut(await deployConsumableExchangingFacet())],
        initFunction: buildConsumableExchangingInitFunction(await deployConsumableExchangingInit(), {
          exchange: exchange.address,
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
        }),
      };
    },
    481927,
  ],
  [
    'ConsumableLimitFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableLimitFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    122101,
  ],
  [
    'ConsumableLimitFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableLimitFacet())],
      initFunction: buildConsumableLimitInitFunction(await deployConsumableLimitInit(), {
        limitConsumableHooks: await deployConsumableLimitConsumableHooks(),
      }),
    }),
    194178,
  ],
  [
    'ConsumableMintFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableMintFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    122101,
  ],
  [
    'ConsumableLimiterFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableLimiterFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    122089,
  ],
  [
    'ConsumableConsumerFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConsumerFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'ConsumableConsumerFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConsumerFacet())],
      initFunction: buildSetRequiredConsumablesFunction(await deployConsumableConsumerInit(), []),
    }),
    106062,
  ],
  [
    'ConsumableConsumerFacet with one required consumable',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConsumerFacet())],
      initFunction: buildSetRequiredConsumablesFunction(await deployConsumableConsumerInit(), [
        { consumable: (await createConsumable()).address, amount: 1 },
      ]),
    }),
    183073,
  ],
  [
    'ConsumableConsumerFacet with two required consumables',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableConsumerFacet())],
      initFunction: buildSetRequiredConsumablesFunction(await deployConsumableConsumerInit(), [
        { consumable: (await createConsumable()).address, amount: 1 },
        { consumable: (await createConsumable()).address, amount: 2 },
      ]),
    }),
    240181,
  ],
  [
    'ConsumableProviderFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableProviderFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'ConsumableProviderFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableProviderFacet())],
      initFunction: buildSetProvidedConsumablesFunction(await deployConsumableProviderInit(), []),
    }),
    106062,
  ],
  [
    'ConsumableProviderFacet with one provided consumable',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableProviderFacet())],
      initFunction: buildSetProvidedConsumablesFunction(await deployConsumableProviderInit(), [
        { consumable: (await createConsumable()).address, amount: 1 },
      ]),
    }),
    183073,
  ],
  [
    'ConsumableProviderFacet with two provided consumables',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableProviderFacet())],
      initFunction: buildSetProvidedConsumablesFunction(await deployConsumableProviderInit(), [
        { consumable: (await createConsumable()).address, amount: 1 },
        { consumable: (await createConsumable()).address, amount: 2 },
      ]),
    }),
    240181,
  ],
  [
    'ContractInfoFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    170609,
  ],
  [
    'ContractInfoFacet with init name',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
      initFunction: buildContractInfoInitializeInitFunction(await deployContractInfoInit(), { name: 'the name' }),
    }),
    212622,
  ],
  [
    'ContractInfoFacet with init name and symbol',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
      initFunction: buildContractInfoInitializeInitFunction(await deployContractInfoInit(), {
        name: 'the name',
        symbol: 'the symbol',
      }),
    }),
    233319,
  ],
  [
    'ContractInfoFacet with init all',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
      initFunction: buildContractInfoInitializeInitFunction(await deployContractInfoInit(), {
        name: 'the name',
        symbol: 'the symbol',
        description: 'the description',
        uri: 'the uri',
      }),
    }),
    274689,
  ],
  [
    'DiamondCutFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployDiamondCutFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'DiamondLoupeFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployDiamondLoupeFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    170597,
  ],
  [
    'DiamondInit',
    async () => ({
      diamondCuts: [],
      initFunction: buildDiamondInitFunction(await deployDiamondInit(), []),
    }),
    5679,
  ],
  [
    'DiamondInit with one init',
    async () => ({
      diamondCuts: [],
      initFunction: buildDiamondInitFunction(await deployDiamondInit(), [
        buildDiamondInitFunction(await deployDiamondInit(), []),
      ]),
    }),
    15006,
  ],
  [
    'DiamondInit with two inits',
    async () => ({
      diamondCuts: [],
      initFunction: buildDiamondInitFunction(await deployDiamondInit(), [
        buildDiamondInitFunction(await deployDiamondInit(), []),
        buildDiamondInitFunction(await deployDiamondInit(), []),
      ]),
    }),
    24282,
  ],
  [
    'DisableableFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployDisableableFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    170609,
  ],
  [
    'ERC165Facet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployErc165Facet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'ERC721Facet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployERC721Facet())],
      initFunction: emptyDiamondInitFunction,
    }),
    313729,
  ],
  [
    'ERC721EnumerableFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployERC721EnumerableFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    146355,
  ],
  [
    'ERC721EnumerableFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployERC721EnumerableFacet())],
      initFunction: buildERC721AddHooksInitFunction(await deployERC721Init(), await deployERC721EnumerableHooks()),
    }),
    218354,
  ],
  [
    'ERC72MintFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployERC721MintFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'ERC72BurnFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployERC721BurnFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'ERC721TokenInfoFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployERC721TokenInfoFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'ERC721TokenInfoFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployERC721TokenInfoFacet())],
      initFunction: buildERC721TokenInfoSetBaseUriInitFunction(await deployERC721TokenInfoInit(), 'base uri'),
    }),
    126878,
  ],
  [
    'SkillAcquirerFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillAcquirerFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'SkillFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    122101,
  ],
  [
    'SkillFacet with skill constrained hooks',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillFacet())],
      initFunction: buildSkillConstrainedSkillInitFunction(await deploySkillConstrainedSkillInit(), {
        requiredSkills: [],
        skillConstrainedSkillHooks: await deploySkillConstrainedSkillHooks(),
      }),
    }),
    198809,
  ],
  [
    'SkillFacet with one required skill',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillFacet())],
      initFunction: buildSkillConstrainedSkillInitFunction(await deploySkillConstrainedSkillInit(), {
        requiredSkills: [{ skill: (await createSkill()).address, level: 1 }],
        skillConstrainedSkillHooks: await deploySkillConstrainedSkillHooks(),
      }),
    }),
    275849,
  ],
  [
    'SkillFacet with two required skills',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillFacet())],
      initFunction: buildSkillConstrainedSkillInitFunction(await deploySkillConstrainedSkillInit(), {
        requiredSkills: [
          { skill: (await createSkill()).address, level: 1 },
          { skill: (await createSkill()).address, level: 2 },
        ],
        skillConstrainedSkillHooks: await deploySkillConstrainedSkillHooks(),
      }),
    }),
    332986,
  ],
  [
    'SkillSelfAcquisitionFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillSelfAcquisitionFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'SkillConstrainedFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillConstrainedFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'SkillConstrainedFacet with init',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillConstrainedFacet())],
      initFunction: buildSetRequiredSkillsFunction(await deploySkillConstrainedInit(), []),
    }),
    106062,
  ],
  [
    'SkillConstrainedFacet with one required skill',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillConstrainedFacet())],
      initFunction: buildSetRequiredSkillsFunction(await deploySkillConstrainedInit(), [
        { skill: (await createSkill()).address, level: 1 },
      ]),
    }),
    183073,
  ],
  [
    'SkillConstrainedFacet with two required skills',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deploySkillConstrainedFacet())],
      initFunction: buildSetRequiredSkillsFunction(await deploySkillConstrainedInit(), [
        { skill: (await createSkill()).address, level: 1 },
        { skill: (await createSkill()).address, level: 2 },
      ]),
    }),
    240181,
  ],
  [
    'TransferFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployTransferFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    146355,
  ],
];

describe('estimates', () => {
  it('base diamond without cuts', async () => {
    const deployTransaction = new Diamond__factory(INITIALIZER).getDeployTransaction({
      diamondCuts: [],
      initFunction: emptyDiamondInitFunction,
    });

    const estimate = await INITIALIZER.estimateGas(deployTransaction);
    expect<BigNumber>(estimate).toEqBN(baseDiamondEstimate);
  });

  test.each(estimateTests)(
    '%s estimate',
    async (
      name: string,
      buildConstructorParams: () => Promise<DiamondConstructorParams> | DiamondConstructorParams,
      differenceFromBase: number,
    ) => {
      const deployTransaction = new Diamond__factory(INITIALIZER).getDeployTransaction(await buildConstructorParams());

      const estimate = await INITIALIZER.estimateGas(deployTransaction);
      console.log(`Total estimate for ${name}: ${estimate.toNumber()}`);
      expect<BigNumber>(estimate.sub(baseDiamondEstimate)).toEqBN(differenceFromBase);
    },
  );
});
