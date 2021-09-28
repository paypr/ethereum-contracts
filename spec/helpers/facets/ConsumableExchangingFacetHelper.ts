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
import { buildConsumableExchangingInitFunction } from '../../../src/contracts/consumables/exchanging';
import { buildDiamondFacetCut } from '../../../src/contracts/diamonds';
import { SUPER_ADMIN_ROLE } from '../../../src/contracts/roles';
import {
  ConsumableExchangingFacet__factory,
  ConsumableExchangingInit__factory,
  IConsumableExchange,
  IConsumableExchanging__factory,
} from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, createDiamond, ExtensibleDiamondOptions } from '../DiamondHelper';
import { deployConsumableConsumerFacet } from './ConsumableConsumerFacetHelper';
import { deployConsumableProviderFacet } from './ConsumableProviderFacetHelper';

export const asConsumableExchanging = (contract: Contract, signer: Signer = INITIALIZER) =>
  IConsumableExchanging__factory.connect(contract.address, signer);

export interface CreateExchangingConsumableOptions extends ExtensibleDiamondOptions {}

export const createConsumableExchanging = async (
  exchange: IConsumableExchange,
  requiredConsumables: ConsumableAmount[] = [],
  providedConsumables: ConsumableAmount[] = [],
  options: CreateExchangingConsumableOptions = {},
) =>
  asConsumableExchanging(
    await createDiamond(
      await buildConsumableExchangingDiamondAdditions(exchange, requiredConsumables, providedConsumables, options),
    ),
  );

export const buildConsumableExchangingDiamondAdditions = async function (
  exchange: IConsumableExchange,
  requiredConsumables: ConsumableAmount[] = [],
  providedConsumables: ConsumableAmount[] = [],
  options: CreateExchangingConsumableOptions = {},
) {
  return combineExtensibleDiamondOptions(
    {
      additionalCuts: [
        buildDiamondFacetCut(await deployConsumableExchangingFacet()),
        buildDiamondFacetCut(await deployConsumableConsumerFacet()),
        buildDiamondFacetCut(await deployConsumableProviderFacet()),
      ],
      additionalRoleAdmins: [{ role: SUPER_ADMIN_ROLE, admins: [INITIALIZER.address] }],
      additionalInits: [
        buildConsumableExchangingInitFunction(await deployConsumableExchangingInit(), {
          exchange,
          requiredConsumables,
          providedConsumables,
        }),
      ],
    },
    options,
  );
};

export const deployConsumableExchangingFacet = () => new ConsumableExchangingFacet__factory(INITIALIZER).deploy();
export const deployConsumableExchangingInit = () => new ConsumableExchangingInit__factory(INITIALIZER).deploy();
