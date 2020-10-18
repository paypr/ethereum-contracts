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

import { PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { createLimitedConsumable, increaseLimit } from '../../../helpers/ConsumableHelper';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import {
  BASE_CONTRACT_ID,
  CONSUMABLE_ID,
  ERC165_ID,
  LIMITED_CONSUMABLE_ID,
  TRANSFERRING_ID,
} from '../../../helpers/ContractIds';
import { shouldSupportInterface } from '../../../helpers/ERC165';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createLimitedConsumable, ERC165_ID);
  shouldSupportInterface('BaseContract', createLimitedConsumable, BASE_CONTRACT_ID);
  shouldSupportInterface('Consumable', createLimitedConsumable, CONSUMABLE_ID);
  shouldSupportInterface('LimitedConsumable', createLimitedConsumable, LIMITED_CONSUMABLE_ID);
  shouldSupportInterface('Transfer', createLimitedConsumable, TRANSFERRING_ID);
});

describe('limitOf', () => {
  it('should return 0 when no accounts with limit', async () => {
    const consumable = await createLimitedConsumable();

    expect<number>(await toNumberAsync(consumable.limitOf(PLAYER1))).toEqual(0);
  });

  it('should return 0 for an account with no limit', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER2, 100);

    expect<number>(await toNumberAsync(consumable.limitOf(PLAYER1))).toEqual(0);
  });

  it('should return the correct limit for an account with a limit', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1, 100);

    expect<number>(await toNumberAsync(consumable.limitOf(PLAYER1))).toEqual(100);

    await increaseLimit(consumable, PLAYER2, 200);

    expect<number>(await toNumberAsync(consumable.limitOf(PLAYER2))).toEqual(200);

    await increaseLimit(consumable, PLAYER1, 50);

    expect<number>(await toNumberAsync(consumable.limitOf(PLAYER1))).toEqual(150);
    expect<number>(await toNumberAsync(consumable.limitOf(PLAYER2))).toEqual(200);
  });
});

describe('myLimit', () => {
  it('should return 0 when no accounts with limit', async () => {
    const consumable = await createLimitedConsumable();

    expect<number>(await toNumberAsync(consumable.myLimit({ from: PLAYER1 }))).toEqual(0);
  });

  it('should return 0 for an account with no limit', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER2, 100);

    expect<number>(await toNumberAsync(consumable.myLimit({ from: PLAYER1 }))).toEqual(0);
  });

  it('should return the correct limit for an account with a limit', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1, 100);

    expect<number>(await toNumberAsync(consumable.myLimit({ from: PLAYER1 }))).toEqual(100);

    await increaseLimit(consumable, PLAYER2, 200);

    expect<number>(await toNumberAsync(consumable.myLimit({ from: PLAYER2 }))).toEqual(200);

    await increaseLimit(consumable, PLAYER1, 50);

    expect<number>(await toNumberAsync(consumable.myLimit({ from: PLAYER1 }))).toEqual(150);
    expect<number>(await toNumberAsync(consumable.myLimit({ from: PLAYER2 }))).toEqual(200);
  });
});
