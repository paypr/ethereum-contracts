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

import { expectRevert } from '@openzeppelin/test-helpers';
import { withDefaultContractInfo } from '../../../../src/contracts/core/contractInfo';
import { createRolesWithAllSameRole } from '../../../helpers/AccessHelper';
import { getContractAddress, INITIALIZER } from '../../../helpers/Accounts';
import { ActivityContract, createActivity } from '../../../helpers/ActivityHelper';
import { createConsumable } from '../../../helpers/ConsumableHelper';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import { shouldRestrictEnableAndDisable } from '../../../helpers/DisableableHelper';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('initializeActivity', () => {
  it('should set the name', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const activity = await ActivityContract.new();
    await activity.initializeActivity(withDefaultContractInfo({ name: 'the name' }), [], [], roleDelegate, {
      from: INITIALIZER,
    });

    expect<string>(await activity.contractName()).toEqual('the name');
  });

  it('should set the description', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const activity = await ActivityContract.new();
    await activity.initializeActivity(
      withDefaultContractInfo({ description: 'the description' }),
      [],
      [],
      roleDelegate,
      {
        from: INITIALIZER,
      },
    );

    expect<string>(await activity.contractDescription()).toEqual('the description');
  });

  it('should set the uri', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const activity = await ActivityContract.new();
    await activity.initializeActivity(withDefaultContractInfo({ uri: 'the uri' }), [], [], roleDelegate, {
      from: INITIALIZER,
    });

    expect<string>(await activity.contractUri()).toEqual('the uri');
  });

  it('should set the consumed amounts', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const activity = await ActivityContract.new();
    await activity.initializeActivity(
      withDefaultContractInfo({}),
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
      [],
      roleDelegate,
      { from: INITIALIZER },
    );

    expect<number>(await toNumberAsync(activity.amountRequired(consumable1.address))).toEqual(100);
    expect<number>(await toNumberAsync(activity.amountRequired(consumable2.address))).toEqual(200);
    expect<number>(await toNumberAsync(activity.amountRequired(consumable3.address))).toEqual(0);

    expect<number>(await toNumberAsync(activity.amountProvided(consumable1.address))).toEqual(0);
    expect<number>(await toNumberAsync(activity.amountProvided(consumable2.address))).toEqual(0);
    expect<number>(await toNumberAsync(activity.amountProvided(consumable3.address))).toEqual(0);
  });

  it('should set the provided amounts', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const activity = await ActivityContract.new();
    await activity.initializeActivity(
      withDefaultContractInfo({}),
      [],
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
      roleDelegate,
      { from: INITIALIZER },
    );

    expect<number>(await toNumberAsync(activity.amountRequired(consumable1.address))).toEqual(0);
    expect<number>(await toNumberAsync(activity.amountRequired(consumable2.address))).toEqual(0);
    expect<number>(await toNumberAsync(activity.amountRequired(consumable3.address))).toEqual(0);

    expect<number>(await toNumberAsync(activity.amountProvided(consumable1.address))).toEqual(100);
    expect<number>(await toNumberAsync(activity.amountProvided(consumable2.address))).toEqual(200);
    expect<number>(await toNumberAsync(activity.amountProvided(consumable3.address))).toEqual(0);
  });

  it('should set the consumed and provided amounts', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const activity = await ActivityContract.new();
    await activity.initializeActivity(
      withDefaultContractInfo({}),
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
      [
        { consumable: consumable2.address, amount: 100 },
        { consumable: consumable3.address, amount: 200 },
      ],
      roleDelegate,
      { from: INITIALIZER },
    );

    expect<number>(await toNumberAsync(activity.amountRequired(consumable1.address))).toEqual(100);
    expect<number>(await toNumberAsync(activity.amountRequired(consumable2.address))).toEqual(200);
    expect<number>(await toNumberAsync(activity.amountRequired(consumable3.address))).toEqual(0);

    expect<number>(await toNumberAsync(activity.amountProvided(consumable1.address))).toEqual(0);
    expect<number>(await toNumberAsync(activity.amountProvided(consumable2.address))).toEqual(100);
    expect<number>(await toNumberAsync(activity.amountProvided(consumable3.address))).toEqual(200);
  });

  it('should revert if called twice', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const activity = await ActivityContract.new();
    await activity.initializeActivity(withDefaultContractInfo({ name: 'the name' }), [], [], roleDelegate, {
      from: INITIALIZER,
    });

    await expectRevert(
      activity.initializeActivity(withDefaultContractInfo({ name: 'the new name' }), [], [], roleDelegate, {
        from: INITIALIZER,
      }),
      'Contract instance has already been initialized',
    );

    expect<string>(await activity.contractName()).toEqual('the name');
  });
});

describe('Enable/Disable', () => {
  shouldRestrictEnableAndDisable(createActivity);
});

describe('transferToken', () => {
  shouldTransferToken(createActivity);
});

describe('transferItem', () => {
  shouldTransferItem(createActivity);
});
