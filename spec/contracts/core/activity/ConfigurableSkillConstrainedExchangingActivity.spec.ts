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

import { expectRevert } from '@openzeppelin/test-helpers';
import { withDefaultContractInfo } from '../../../../src/contracts/core/contractInfo';
import { createRolesWithAllSameRole } from '../../../helpers/AccessHelper';
import { getContractAddress, INITIALIZER } from '../../../helpers/Accounts';
import {
  createSkillConstrainedExchangingActivity,
  SkillConstrainedExchangingActivity,
} from '../../../helpers/ActivityHelper';
import { createConsumableExchange, createConvertibleConsumable } from '../../../helpers/ConsumableHelper';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import { shouldRestrictEnableAndDisable } from '../../../helpers/DisableableHelper';
import { createSkill } from '../../../helpers/SkillHelper';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('initializeSkillConstrainedExchangingActivity', () => {
  it('should set the name', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const exchange = await createConsumableExchange();

    const activity = await SkillConstrainedExchangingActivity.new();
    await activity.initializeSkillConstrainedExchangingActivity(
      withDefaultContractInfo({ name: 'the name' }),
      [],
      [],
      [],
      exchange.address,
      roleDelegate,
      { from: INITIALIZER },
    );

    expect<string>(await activity.contractName()).toEqual('the name');
  });

  it('should set the description', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const exchange = await createConsumableExchange();

    const activity = await SkillConstrainedExchangingActivity.new();
    await activity.initializeSkillConstrainedExchangingActivity(
      withDefaultContractInfo({ description: 'the description' }),
      [],
      [],
      [],
      exchange.address,
      roleDelegate,
      { from: INITIALIZER },
    );

    expect<string>(await activity.contractDescription()).toEqual('the description');
  });

  it('should set the uri', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const exchange = await createConsumableExchange();

    const activity = await SkillConstrainedExchangingActivity.new();
    await activity.initializeSkillConstrainedExchangingActivity(
      withDefaultContractInfo({ uri: 'the uri' }),
      [],
      [],
      [],
      exchange.address,
      roleDelegate,
      { from: INITIALIZER },
    );

    expect<string>(await activity.contractUri()).toEqual('the uri');
  });

  it('should set the required skills', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const exchange = await createConsumableExchange();

    const skill1 = await createSkill({ name: 'skill 1' });
    const skill2 = await createSkill({ name: 'skill 2' });

    const activity = await SkillConstrainedExchangingActivity.new();
    await activity.initializeSkillConstrainedExchangingActivity(
      withDefaultContractInfo({}),
      [
        { skill: skill1.address, level: 1 },
        { skill: skill2.address, level: 2 },
      ],
      [],
      [],
      exchange.address,
      roleDelegate,
      { from: INITIALIZER },
    );

    expect<boolean>(await activity.isSkillRequired(skill1.address)).toEqual(true);
    expect<boolean>(await activity.isSkillRequired(skill2.address)).toEqual(true);

    expect<number>(await toNumberAsync(activity.skillLevelRequired(skill1.address))).toEqual(1);
    expect<number>(await toNumberAsync(activity.skillLevelRequired(skill2.address))).toEqual(2);
  });

  it('should set the consumed amounts', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 1);
    const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1);
    const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' }, '', 1);

    const activity = await SkillConstrainedExchangingActivity.new();
    await activity.initializeSkillConstrainedExchangingActivity(
      withDefaultContractInfo({}),
      [],
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
      [],
      exchange.address,
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

  it('should set the consumed and provided amounts', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 1);
    const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1);
    const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' }, '', 1);

    const activity = await SkillConstrainedExchangingActivity.new();
    await activity.initializeSkillConstrainedExchangingActivity(
      withDefaultContractInfo({}),
      [],
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
      [
        { consumable: consumable2.address, amount: 100 },
        { consumable: consumable3.address, amount: 200 },
      ],
      exchange.address,
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

  it('should set the exchange', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const exchange = await createConsumableExchange();

    const activity = await SkillConstrainedExchangingActivity.new();
    await activity.initializeSkillConstrainedExchangingActivity(
      withDefaultContractInfo({}),
      [],
      [],
      [],
      exchange.address,
      roleDelegate,
      {
        from: INITIALIZER,
      },
    );

    expect<string>(await activity.exchange()).toEqual(exchange.address);
  });

  it('should set the execution profit', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 100);
    const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1000);
    const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' }, '', 10_000);

    const activity = await SkillConstrainedExchangingActivity.new();
    await activity.initializeSkillConstrainedExchangingActivity(
      withDefaultContractInfo({}),
      [],
      [
        { consumable: consumable1.address, amount: 100_000 },
        { consumable: consumable2.address, amount: 20_000 },
      ],
      [
        { consumable: consumable2.address, amount: 1000 },
        { consumable: consumable3.address, amount: 50_000 },
      ],
      exchange.address,
      roleDelegate,
      { from: INITIALIZER },
    );

    //   (100,000 / 100 + 20,000 / 1,000) - (1,000 / 1,000 + 50_000 / 10_000)
    // = (     1,000    +       20      ) - (      1       +        5       )
    // =              1,020               -                6
    // = 1,014

    expect<number>(await toNumberAsync(activity.executionProfit())).toEqual(1014);
  });

  it('should revert if called twice', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const exchange = await createConsumableExchange();

    const activity = await SkillConstrainedExchangingActivity.new();
    await activity.initializeSkillConstrainedExchangingActivity(
      withDefaultContractInfo({ name: 'the name' }),
      [],
      [],
      [],
      exchange.address,
      roleDelegate,
      {
        from: INITIALIZER,
      },
    );

    await expectRevert(
      activity.initializeSkillConstrainedExchangingActivity(
        withDefaultContractInfo({ name: 'the new name' }),
        [],
        [],
        [],
        exchange.address,
        roleDelegate,
        {
          from: INITIALIZER,
        },
      ),
      'Contract instance has already been initialized',
    );

    expect<string>(await activity.contractName()).toEqual('the name');
  });

  it('should revert if not sustainable', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 300);
    const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 200);
    const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' }, '', 100);

    const activity = await SkillConstrainedExchangingActivity.new();

    await expectRevert(
      activity.initializeSkillConstrainedExchangingActivity(
        withDefaultContractInfo({}),
        [],
        [],
        [
          { consumable: consumable1.address, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ],
        exchange.address,
        roleDelegate,
        { from: INITIALIZER },
      ),
      'Not enough exchange token consumed to be sustainable',
    );

    await expectRevert(
      activity.initializeSkillConstrainedExchangingActivity(
        withDefaultContractInfo({}),
        [],
        [
          { consumable: consumable1.address, amount: 100 }, // 30_000
        ],
        [
          { consumable: consumable2.address, amount: 100 }, // 20_000
          { consumable: consumable3.address, amount: 200 }, // 20_000
        ],
        exchange.address,
        roleDelegate,
        { from: INITIALIZER },
      ),
      'Not enough exchange token consumed to be sustainable',
    );
  });

  it('should revert if not sustainable with asymmetric exchange rates', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 30, 300);
    const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 200);
    const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' }, '', 100, 200);

    const activity = await SkillConstrainedExchangingActivity.new();

    await expectRevert(
      activity.initializeSkillConstrainedExchangingActivity(
        withDefaultContractInfo({}),
        [],
        [],
        [
          { consumable: consumable1.address, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ],
        exchange.address,
        roleDelegate,
        { from: INITIALIZER },
      ),
      'Not enough exchange token consumed to be sustainable',
    );

    await expectRevert(
      activity.initializeSkillConstrainedExchangingActivity(
        withDefaultContractInfo({}),
        [],
        [
          { consumable: consumable1.address, amount: 100 }, // 30_000
        ],
        [
          { consumable: consumable2.address, amount: 100 }, // 20_000
          { consumable: consumable3.address, amount: 200 }, // 20_000
        ],
        exchange.address,
        roleDelegate,
        { from: INITIALIZER },
      ),
      'Not enough exchange token consumed to be sustainable',
    );
  });
});

describe('Enable/Disable', () => {
  const create = async () => {
    const exchange = await createConsumableExchange();
    return createSkillConstrainedExchangingActivity(exchange.address);
  };

  shouldRestrictEnableAndDisable(create);
});

describe('transferToken', () => {
  const createActivity = async () => {
    const exchange = await createConsumableExchange();
    return createSkillConstrainedExchangingActivity(exchange.address);
  };

  shouldTransferToken(createActivity);
});

describe('transferItem', () => {
  const createActivity = async () => {
    const exchange = await createConsumableExchange();
    return createSkillConstrainedExchangingActivity(exchange.address);
  };

  shouldTransferItem(createActivity);
});
