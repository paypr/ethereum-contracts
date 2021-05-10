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

import { ConsumableAmount } from '../../src/contracts/core/consumables';
import { ContractInfo, withDefaultContractInfo } from '../../src/contracts/core/contractInfo';
import { SkillLevel } from '../../src/contracts/core/skills';
import {
  ConfigurableActivity__factory,
  ConfigurableExchangingActivity__factory,
  ConfigurableSkillConstrainedExchangingActivity__factory,
} from '../../types/contracts';
import { getOrDefaultRoleDelegate } from './AccessHelper';
import { INITIALIZER } from './Accounts';

export const deployActivityContract = () => new ConfigurableActivity__factory(INITIALIZER).deploy();
export const deployExchangingActivityContract = () => new ConfigurableExchangingActivity__factory(INITIALIZER).deploy();
export const deploySkillConstrainedExchangingActivity = () =>
  new ConfigurableSkillConstrainedExchangingActivity__factory(INITIALIZER).deploy();

export const createActivity = async (
  info: Partial<ContractInfo> = {},
  amountsToConsume: ConsumableAmount[] = [],
  amountsToProvide: ConsumableAmount[] = [],
  roleDelegate?: string,
) => {
  const activity = await deployActivityContract();
  await activity
    .connect(INITIALIZER)
    .initializeActivity(
      withDefaultContractInfo(info),
      amountsToConsume,
      amountsToProvide,
      await getOrDefaultRoleDelegate(roleDelegate, INITIALIZER),
    );
  return activity;
};

export const createExchangingActivity = async (
  tokenForExchange: string,
  info: Partial<ContractInfo> = {},
  amountsToConsume: ConsumableAmount[] = [],
  amountsToProvide: ConsumableAmount[] = [],
  roleDelegate?: string,
) => {
  const activity = await deployExchangingActivityContract();
  await activity
    .connect(INITIALIZER)
    .initializeExchangingActivity(
      withDefaultContractInfo(info),
      amountsToConsume,
      amountsToProvide,
      tokenForExchange,
      await getOrDefaultRoleDelegate(roleDelegate, INITIALIZER),
    );
  return activity;
};

export const createSkillConstrainedExchangingActivity = async (
  tokenForExchange: string,
  info: Partial<ContractInfo> = {},
  requiredSkills: SkillLevel[] = [],
  amountsToConsume: ConsumableAmount[] = [],
  amountsToProvide: ConsumableAmount[] = [],
  roleDelegate?: string,
) => {
  const activity = await deploySkillConstrainedExchangingActivity();
  await activity
    .connect(INITIALIZER)
    .initializeSkillConstrainedExchangingActivity(
      withDefaultContractInfo(info),
      requiredSkills,
      amountsToConsume,
      amountsToProvide,
      tokenForExchange,
      await getOrDefaultRoleDelegate(roleDelegate, INITIALIZER),
    );
  return activity;
};
