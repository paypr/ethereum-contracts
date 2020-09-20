import { expectRevert } from '@openzeppelin/test-helpers';
import { withDefaultContractInfo } from '../../../../src/contracts/core/contractInfo';
import { createRolesWithAllSameRole } from '../../../helpers/AccessHelper';
import { getContractAddress, INITIALIZER } from '../../../helpers/Accounts';
import { createExchangingActivity, ExchangingActivityContract } from '../../../helpers/ActivityHelper';
import { createConsumableExchange, createConvertibleConsumable } from '../../../helpers/ConsumableHelper';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import { shouldRestrictEnableAndDisable } from '../../../helpers/DisableableHelper';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('initializeExchangingActivity', () => {
  it('should set the name', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const exchange = await createConsumableExchange();

    const activity = await ExchangingActivityContract.new();
    await activity.initializeExchangingActivity(
      withDefaultContractInfo({ name: 'the name' }),
      [],
      [],
      exchange.address,
      roleDelegate,
      {
        from: INITIALIZER,
      },
    );

    expect<string>(await activity.contractName()).toEqual('the name');
  });

  it('should set the description', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const exchange = await createConsumableExchange();

    const activity = await ExchangingActivityContract.new();
    await activity.initializeExchangingActivity(
      withDefaultContractInfo({ description: 'the description' }),
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

    const activity = await ExchangingActivityContract.new();
    await activity.initializeExchangingActivity(
      withDefaultContractInfo({ uri: 'the uri' }),
      [],
      [],
      exchange.address,
      roleDelegate,
      {
        from: INITIALIZER,
      },
    );

    expect<string>(await activity.contractUri()).toEqual('the uri');
  });

  it('should set the consumed amounts', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 1);
    const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1);
    const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' }, '', 1);

    const activity = await ExchangingActivityContract.new();
    await activity.initializeExchangingActivity(
      withDefaultContractInfo({}),
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

    const activity = await ExchangingActivityContract.new();
    await activity.initializeExchangingActivity(
      withDefaultContractInfo({}),
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

    const activity = await ExchangingActivityContract.new();
    await activity.initializeExchangingActivity(withDefaultContractInfo({}), [], [], exchange.address, roleDelegate, {
      from: INITIALIZER,
    });

    expect<string>(await activity.exchange()).toEqual(exchange.address);
  });

  it('should set the execution profit', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const exchange = await createConsumableExchange();

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 100);
    const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1000);
    const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' }, '', 10_000);

    const activity = await ExchangingActivityContract.new();
    await activity.initializeExchangingActivity(
      withDefaultContractInfo({}),
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

    const activity = await ExchangingActivityContract.new();
    await activity.initializeExchangingActivity(
      withDefaultContractInfo({ name: 'the name' }),
      [],
      [],
      exchange.address,
      roleDelegate,
      {
        from: INITIALIZER,
      },
    );

    await expectRevert(
      activity.initializeExchangingActivity(
        withDefaultContractInfo({ name: 'the new name' }),
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

    const activity = await ExchangingActivityContract.new();

    await expectRevert(
      activity.initializeExchangingActivity(
        withDefaultContractInfo({}),
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
      activity.initializeExchangingActivity(
        withDefaultContractInfo({}),
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
  const createActivity = async () => {
    const exchange = await createConsumableExchange();
    return createExchangingActivity(exchange.address);
  };

  shouldRestrictEnableAndDisable(createActivity);
});

describe('transferToken', () => {
  const createActivity = async () => {
    const exchange = await createConsumableExchange();
    return createExchangingActivity(exchange.address);
  };

  shouldTransferToken(createActivity);
});

describe('transferItem', () => {
  const createActivity = async () => {
    const exchange = await createConsumableExchange();
    return createExchangingActivity(exchange.address);
  };

  shouldTransferItem(createActivity);
});
