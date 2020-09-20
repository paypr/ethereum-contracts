import { PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { createSkillConstrainedExchangingActivity } from '../../../helpers/ActivityHelper';
import { createConsumableExchange } from '../../../helpers/ConsumableHelper';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import {
  ACTIVITY_ID,
  BASE_CONTRACT_ID,
  CONSUMABLE_CONSUMER_ID,
  CONSUMABLE_PROVIDER_ID,
  ERC165_ID,
  SKILL_CONSTRAINED_ID,
  TRANSFERRING_ID,
} from '../../../helpers/ContractIds';
import { shouldSupportInterface } from '../../../helpers/ERC165';

describe('supportsInterface', () => {
  const createActivity = async () => {
    const exchange = await createConsumableExchange();

    return createSkillConstrainedExchangingActivity(exchange.address);
  };

  shouldSupportInterface('ERC165', createActivity, ERC165_ID);
  shouldSupportInterface('BaseContract', createActivity, BASE_CONTRACT_ID);
  shouldSupportInterface('Activity', createActivity, ACTIVITY_ID);
  shouldSupportInterface('ConsumableConsumer', createActivity, CONSUMABLE_CONSUMER_ID);
  shouldSupportInterface('ConsumableProvider', createActivity, CONSUMABLE_PROVIDER_ID);
  shouldSupportInterface('SkillConstrained', createActivity, SKILL_CONSTRAINED_ID);
  shouldSupportInterface('Transfer', createActivity, TRANSFERRING_ID);
});

describe('executed', () => {
  it('should return 0 when it has never been executed', async () => {
    const exchange = await createConsumableExchange();

    const activity = await createSkillConstrainedExchangingActivity(exchange.address);

    const result1 = await toNumberAsync(activity.executed(PLAYER1));
    expect<number>(result1).toEqual(0);

    const result2 = await toNumberAsync(activity.executed(PLAYER2));
    expect<number>(result2).toEqual(0);
  });

  it('should return 0 when the player has never executed the activity', async () => {
    const exchange = await createConsumableExchange();

    const activity = await createSkillConstrainedExchangingActivity(exchange.address);

    await activity.execute([], { from: PLAYER2 });

    const result = await toNumberAsync(activity.executed(PLAYER1));
    expect<number>(result).toEqual(0);
  });

  it('should return the number of times the player has executed the activity', async () => {
    const exchange = await createConsumableExchange();

    const activity = await createSkillConstrainedExchangingActivity(exchange.address);

    await activity.execute([], { from: PLAYER1 });
    await activity.execute([], { from: PLAYER2 });
    await activity.execute([], { from: PLAYER2 });

    const result1 = await toNumberAsync(activity.executed(PLAYER1));
    expect<number>(result1).toEqual(1);

    const result2 = await toNumberAsync(activity.executed(PLAYER2));
    expect<number>(result2).toEqual(2);
  });
});

describe('totalExecuted', () => {
  it('should return 0 when it has never been executed', async () => {
    const exchange = await createConsumableExchange();

    const activity = await createSkillConstrainedExchangingActivity(exchange.address);

    const result = await toNumberAsync(activity.totalExecuted());
    expect<number>(result).toEqual(0);
  });

  it('should return the number of times the activity has been executed by all players', async () => {
    const exchange = await createConsumableExchange();

    const activity = await createSkillConstrainedExchangingActivity(exchange.address);

    await activity.execute([], { from: PLAYER1 });

    const result1 = await toNumberAsync(activity.totalExecuted());
    expect<number>(result1).toEqual(1);

    await activity.execute([], { from: PLAYER2 });
    await activity.execute([], { from: PLAYER1 });

    const result2 = await toNumberAsync(activity.totalExecuted());
    expect<number>(result2).toEqual(3);
  });
});
