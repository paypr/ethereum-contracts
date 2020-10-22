/*
 * Copyright (c) 2020 The Paypr Company, LLC
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

import { PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { createActivity } from '../../../helpers/ActivityHelper';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import {
  ACTIVITY_ID,
  BASE_CONTRACT_ID,
  CONSUMABLE_CONSUMER_ID,
  CONSUMABLE_PROVIDER_ID,
  ERC165_ID,
  TRANSFERRING_ID,
} from '../../../helpers/ContractIds';
import { shouldSupportInterface } from '../../../helpers/ERC165';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createActivity, ERC165_ID);
  shouldSupportInterface('BaseContract', createActivity, BASE_CONTRACT_ID);
  shouldSupportInterface('Activity', createActivity, ACTIVITY_ID);
  shouldSupportInterface('ConsumableConsumer', createActivity, CONSUMABLE_CONSUMER_ID);
  shouldSupportInterface('ConsumableProvider', createActivity, CONSUMABLE_PROVIDER_ID);
  shouldSupportInterface('Transfer', createActivity, TRANSFERRING_ID);
});

describe('executed', () => {
  it('should return 0 when it has never been executed', async () => {
    const activity = await createActivity();

    const result1 = await toNumberAsync(activity.executed(PLAYER1));
    expect<number>(result1).toEqual(0);

    const result2 = await toNumberAsync(activity.executed(PLAYER2));
    expect<number>(result2).toEqual(0);
  });

  it('should return 0 when the player has never executed the activity', async () => {
    const activity = await createActivity();

    await activity.execute([], { from: PLAYER2 });

    const result = await toNumberAsync(activity.executed(PLAYER1));
    expect<number>(result).toEqual(0);
  });

  it('should return the number of times the player has executed the activity', async () => {
    const activity = await createActivity();

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
    const activity = await createActivity();

    const result = await toNumberAsync(activity.totalExecuted());
    expect<number>(result).toEqual(0);
  });

  it('should return the number of times the activity has been executed by all players', async () => {
    const activity = await createActivity();

    await activity.execute([], { from: PLAYER1 });

    const result1 = await toNumberAsync(activity.totalExecuted());
    expect<number>(result1).toEqual(1);

    await activity.execute([], { from: PLAYER2 });
    await activity.execute([], { from: PLAYER1 });

    const result2 = await toNumberAsync(activity.totalExecuted());
    expect<number>(result2).toEqual(3);
  });
});
