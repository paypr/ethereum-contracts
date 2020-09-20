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
