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
  ACTIVITY_ID,
  BASE_CONTRACT_ID,
  CONSUMABLE_CONSUMER_ID,
  CONSUMABLE_PROVIDER_ID,
  ERC165_ID,
  TRANSFERRING_ID,
} from '../../../helpers/ContractIds';
import { PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { createExchangingActivity } from '../../../helpers/ActivityHelper';
import { createConsumableExchange } from '../../../helpers/ConsumableHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165';

describe('supportsInterface', () => {
  const createActivity = async () => {
    const exchange = await createConsumableExchange();

    return createExchangingActivity(exchange.address);
  };

  shouldSupportInterface('ERC165', createActivity, ERC165_ID);
  shouldSupportInterface('BaseContract', createActivity, BASE_CONTRACT_ID);
  shouldSupportInterface('Activity', createActivity, ACTIVITY_ID);
  shouldSupportInterface('ConsumableConsumer', createActivity, CONSUMABLE_CONSUMER_ID);
  shouldSupportInterface('ConsumableProvider', createActivity, CONSUMABLE_PROVIDER_ID);
  shouldSupportInterface('Transfer', createActivity, TRANSFERRING_ID);
});

describe('executed', () => {
  it('should return 0 when it has never been executed', async () => {
    const exchange = await createConsumableExchange();

    const activity = await createExchangingActivity(exchange.address);

    expect<BigNumber>(await activity.executed(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await activity.executed(PLAYER2.address)).toEqBN(0);
  });

  it('should return 0 when the player has never executed the activity', async () => {
    const exchange = await createConsumableExchange();

    const activity = await createExchangingActivity(exchange.address);

    await activity.connect(PLAYER2).execute([]);

    expect<BigNumber>(await activity.executed(PLAYER1.address)).toEqBN(0);
  });

  it('should return the number of times the player has executed the activity', async () => {
    const exchange = await createConsumableExchange();

    const activity = await createExchangingActivity(exchange.address);

    await activity.connect(PLAYER1).execute([]);
    await activity.connect(PLAYER2).execute([]);
    await activity.connect(PLAYER2).execute([]);

    expect<BigNumber>(await activity.executed(PLAYER1.address)).toEqBN(1);
    expect<BigNumber>(await activity.executed(PLAYER2.address)).toEqBN(2);
  });
});

describe('totalExecuted', () => {
  it('should return 0 when it has never been executed', async () => {
    const exchange = await createConsumableExchange();

    const activity = await createExchangingActivity(exchange.address);

    const result = await activity.totalExecuted();
    expect<BigNumber>(result).toEqBN(0);
  });

  it('should return the number of times the activity has been executed by all players', async () => {
    const exchange = await createConsumableExchange();

    const activity = await createExchangingActivity(exchange.address);

    await activity.connect(PLAYER1).execute([]);

    const result1 = await activity.totalExecuted();
    expect<BigNumber>(result1).toEqBN(1);

    await activity.connect(PLAYER2).execute([]);
    await activity.connect(PLAYER1).execute([]);

    expect<BigNumber>(await activity.totalExecuted()).toEqBN(3);
  });
});
