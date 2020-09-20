import { ConsumableAmount } from '../../src/contracts/core/consumables';
import { ContractInfo, withDefaultContractInfo } from '../../src/contracts/core/contractInfo';
import { SkillLevel } from '../../src/contracts/core/skills';
import { getOrDefaultRoleDelegate } from './AccessHelper';
import { INITIALIZER } from './Accounts';
import { getContract } from './ContractHelper';

export const ActivityContract = getContract('ConfigurableActivity');
export const ExchangingActivityContract = getContract('ConfigurableExchangingActivity');
export const SkillConstrainedExchangingActivity = getContract('ConfigurableSkillConstrainedExchangingActivity');

export const createActivity = async (
  info: Partial<ContractInfo> = {},
  amountsToConsume: ConsumableAmount[] = [],
  amountsToProvide: ConsumableAmount[] = [],
  roleDelegate?: string,
) => {
  const activity = await ActivityContract.new();
  await activity.initializeActivity(
    withDefaultContractInfo(info),
    amountsToConsume,
    amountsToProvide,
    await getOrDefaultRoleDelegate(roleDelegate, INITIALIZER),
    {
      from: INITIALIZER,
    },
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
  const activity = await ExchangingActivityContract.new();
  await activity.initializeExchangingActivity(
    withDefaultContractInfo(info),
    amountsToConsume,
    amountsToProvide,
    tokenForExchange,
    await getOrDefaultRoleDelegate(roleDelegate, INITIALIZER),
    { from: INITIALIZER },
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
  const activity = await SkillConstrainedExchangingActivity.new();
  await activity.initializeSkillConstrainedExchangingActivity(
    withDefaultContractInfo(info),
    requiredSkills,
    amountsToConsume,
    amountsToProvide,
    tokenForExchange,
    await getOrDefaultRoleDelegate(roleDelegate, INITIALIZER),
    { from: INITIALIZER },
  );
  return activity;
};
