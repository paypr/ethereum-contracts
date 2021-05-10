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
  ConfigurableConstrainedSkill__factory,
  ConfigurableSkill__factory,
  TestSkillConstrained__factory,
} from '../../types/contracts';
import { getOrDefaultRoleDelegate } from './AccessHelper';
import { INITIALIZER } from './Accounts';

export const deploySkillContract = () => new ConfigurableSkill__factory(INITIALIZER).deploy();
export const deploySkillConstrainedContract = () => new TestSkillConstrained__factory(INITIALIZER).deploy();
export const deployConstrainedSkillContract = () => new ConfigurableConstrainedSkill__factory(INITIALIZER).deploy();

export const createSkill = async (info: Partial<ContractInfo> = {}, roleDelegate?: string) => {
  const skill = await deploySkillContract();
  await skill
    .connect(INITIALIZER)
    .initializeSkill(withDefaultContractInfo(info), await getOrDefaultRoleDelegate(roleDelegate, INITIALIZER));
  return skill;
};

export const createSkillConstrained = async (requiredSkills: SkillLevel[] = []) => {
  const skillConstrained = await deploySkillConstrainedContract();
  await skillConstrained.connect(INITIALIZER).initializeSkillConstrained(requiredSkills);
  return skillConstrained;
};

export const createConstrainedSkill = async (
  info: Partial<ContractInfo> = {},
  amountsToConsume: ConsumableAmount[] = [],
  requiredSkills: SkillLevel[] = [],
  roleDelegate?: string,
) => {
  const skill = await deployConstrainedSkillContract();
  await skill
    .connect(INITIALIZER)
    .initializeConstrainedSkill(
      withDefaultContractInfo(info),
      amountsToConsume,
      requiredSkills,
      await getOrDefaultRoleDelegate(roleDelegate, INITIALIZER),
    );
  return skill;
};
