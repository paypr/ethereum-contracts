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
import { buildSetRequiredConsumablesFunction } from '../../../src/contracts/consumables/consumer';
import { buildDiamondFacetCut } from '../../../src/contracts/diamonds';
import { SUPER_ADMIN_ROLE } from '../../../src/contracts/roles';
import {
  ConsumableConsumerFacet,
  ConsumableConsumerFacet__factory,
  ConsumableConsumerInit,
  ConsumableConsumerInit__factory,
  IConsumableConsumer__factory,
  TestConsumableConsumerFacet__factory,
} from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, createDiamond, ExtensibleDiamondOptions } from '../DiamondHelper';

export const asConsumableConsumer = (contract: Contract, signer: Signer = INITIALIZER) =>
  IConsumableConsumer__factory.connect(contract.address, signer);

export const asTestConsumableConsumer = (contract: Contract, signer: Signer = INITIALIZER) =>
  TestConsumableConsumerFacet__factory.connect(contract.address, signer);

export interface CreateConsumerConsumableOptions extends ExtensibleDiamondOptions {
  consumerFacet?: ConsumableConsumerFacet;
  consumerInit?: ConsumableConsumerInit;
}

export const createConsumableConsumer = async (
  requiredConsumables: ConsumableAmount[],
  options: CreateConsumerConsumableOptions = {},
) =>
  asConsumableConsumer(
    await createDiamond(await buildConsumableConsumerDiamondAdditions(requiredConsumables, options)),
  );

export const buildConsumableConsumerDiamondAdditions = async function (
  requiredConsumables: ConsumableAmount[],
  options: CreateConsumerConsumableOptions = {},
) {
  const consumerFacet = options.consumerFacet || (await deployConsumableConsumerFacet());
  const consumerInit = options.consumerInit || (await deployConsumableConsumerInit());

  return combineExtensibleDiamondOptions(
    {
      additionalCuts: [buildDiamondFacetCut(consumerFacet)],
      additionalRoleAdmins: [{ role: SUPER_ADMIN_ROLE, admins: [INITIALIZER.address] }],
      additionalInits: [buildSetRequiredConsumablesFunction(consumerInit, requiredConsumables)],
    },
    options,
  );
};

export const createTestConsumableConsumer = async (requiredConsumables: ConsumableAmount[]) =>
  asTestConsumableConsumer(
    await createConsumableConsumer(requiredConsumables, {
      additionalCuts: [buildDiamondFacetCut(await deployTestConsumableConsumerFacet())],
    }),
  );

export const deployConsumableConsumerFacet = () => new ConsumableConsumerFacet__factory(INITIALIZER).deploy();
export const deployConsumableConsumerInit = () => new ConsumableConsumerInit__factory(INITIALIZER).deploy();
export const deployTestConsumableConsumerFacet = () => new TestConsumableConsumerFacet__factory(INITIALIZER).deploy();
