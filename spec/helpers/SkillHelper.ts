/*
 * Copyright (c) 2020 The Paypr Company
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

import { Item } from '../../src/contracts/core/activities';
import { ConsumableAmount } from '../../src/contracts/core/consumables';
import { ContractInfo, withDefaultContractInfo } from '../../src/contracts/core/contractInfo';
import { SkillLevel } from '../../src/contracts/core/skills';
import { getOrDefaultRoleDelegate } from './AccessHelper';
import { INITIALIZER } from './Accounts';
import { getContract, toNumberAsync } from './ContractHelper';

export const SkillContract = getContract('ConfigurableSkill');
export const SkillConstrainedContract = getContract('TestSkillConstrained');
export const ConstrainedSkillContract = getContract('ConfigurableConstrainedSkill');

export const createSkill = async (info: Partial<ContractInfo> = {}, roleDelegate?: string) => {
  const skill = await SkillContract.new();
  await skill.initializeSkill(
    withDefaultContractInfo(info),
    await getOrDefaultRoleDelegate(roleDelegate, INITIALIZER),
    { from: INITIALIZER },
  );
  return skill;
};

export const createSkillConstrained = async (requiredSkills: SkillLevel[] = []) => {
  const skillConstrained = await SkillConstrainedContract.new();
  await skillConstrained.initializeSkillConstrained(requiredSkills, { from: INITIALIZER });
  return skillConstrained;
};

export const createConstrainedSkill = async (
  info: Partial<ContractInfo> = {},
  amountsToConsume: ConsumableAmount[] = [],
  requiredSkills: SkillLevel[] = [],
  roleDelegate?: string,
) => {
  const skill = await ConstrainedSkillContract.new();
  await skill.initializeConstrainedSkill(
    withDefaultContractInfo(info),
    amountsToConsume,
    requiredSkills,
    await getOrDefaultRoleDelegate(roleDelegate, INITIALIZER),
    {
      from: INITIALIZER,
    },
  );
  return skill;
};

export const getSkilllevel = async (skill: any, player: string) => toNumberAsync(skill.currentLevel(player));

export const acquireNextSkillLevel = async (skill: any, player: string, useItems: Item[] = []) =>
  skill.acquireNext(useItems, { from: player });
