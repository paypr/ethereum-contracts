import { expectRevert } from '@openzeppelin/test-helpers';
import { withDefaultContractInfo } from '../../../../src/contracts/core/contractInfo';
import { createRolesWithAllSameRole } from '../../../helpers/AccessHelper';
import { CONSUMABLE_MINTER, getContractAddress, PLAYER1, PLAYER2, PLAYER3 } from '../../../helpers/Accounts';
import {
  ConvertibleConsumableContract,
  createConsumable,
  createConsumableExchange,
  createConvertibleConsumable,
  getBalance,
  mintConsumable,
} from '../../../helpers/ConsumableHelper';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import { shouldRestrictEnableAndDisable } from '../../../helpers/DisableableHelper';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('initializeConsumable', () => {
  it('should set the name', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await createConsumable();

    const convertibleConsumable = await ConvertibleConsumableContract.new();
    await convertibleConsumable.initializeConvertibleConsumable(
      withDefaultContractInfo({ name: 'the name' }),
      '',
      consumable.address,
      1,
      false,
      roleDelegate,
      { from: CONSUMABLE_MINTER },
    );

    expect<string>(await convertibleConsumable.name()).toEqual('the name');
    expect<string>(await convertibleConsumable.contractName()).toEqual('the name');
  });

  it('should set the description', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await createConsumable();

    const convertibleConsumable = await ConvertibleConsumableContract.new();
    await convertibleConsumable.initializeConvertibleConsumable(
      withDefaultContractInfo({ description: 'the description' }),
      '',
      consumable.address,
      1,
      false,
      roleDelegate,
      { from: CONSUMABLE_MINTER },
    );

    expect<string>(await convertibleConsumable.contractDescription()).toEqual('the description');
  });

  it('should set the uri', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await createConsumable();

    const convertibleConsumable = await ConvertibleConsumableContract.new();
    await convertibleConsumable.initializeConvertibleConsumable(
      withDefaultContractInfo({ uri: 'the uri' }),
      '',
      consumable.address,
      1,
      false,
      roleDelegate,
      { from: CONSUMABLE_MINTER },
    );

    expect<string>(await convertibleConsumable.contractUri()).toEqual('the uri');
  });

  it('should set the symbol', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await createConsumable();

    const convertibleConsumable = await ConvertibleConsumableContract.new();
    await convertibleConsumable.initializeConvertibleConsumable(
      withDefaultContractInfo({}),
      'the symbol',
      consumable.address,
      1,
      false,
      roleDelegate,
      { from: CONSUMABLE_MINTER },
    );

    expect<string>(await convertibleConsumable.symbol()).toEqual('the symbol');
  });

  it('should set the exchange token', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await createConsumable();

    const convertibleConsumable = await ConvertibleConsumableContract.new();
    await convertibleConsumable.initializeConvertibleConsumable(
      withDefaultContractInfo({ name: 'the name' }),
      '',
      consumable.address,
      1,
      false,
      roleDelegate,
      { from: CONSUMABLE_MINTER },
    );

    expect<string>(await convertibleConsumable.exchangeToken()).toEqual(consumable.address);
  });

  it('should set the exchange rate', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await createConsumable();

    const convertibleConsumable = await ConvertibleConsumableContract.new();
    await convertibleConsumable.initializeConvertibleConsumable(
      withDefaultContractInfo({ name: 'the name' }),
      '',
      consumable.address,
      100,
      false,
      roleDelegate,
      { from: CONSUMABLE_MINTER },
    );

    expect<number>(await toNumberAsync(convertibleConsumable.exchangeRate())).toEqual(100);
  });

  it('should register with the exchange', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const exchange = await createConsumableExchange();

    const convertibleConsumable = await ConvertibleConsumableContract.new();
    await convertibleConsumable.initializeConvertibleConsumable(
      withDefaultContractInfo({ name: 'the name' }),
      '',
      exchange.address,
      100,
      true,
      roleDelegate,
      { from: CONSUMABLE_MINTER },
    );

    expect<boolean>(await exchange.isConvertible(convertibleConsumable.address)).toEqual(true);
    expect<number>(await toNumberAsync(exchange.exchangeRateOf(convertibleConsumable.address))).toEqual(100);
  });

  it('should revert if the exchange rate == 0', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await createConsumable();

    const convertibleConsumable = await ConvertibleConsumableContract.new();
    await expectRevert(
      convertibleConsumable.initializeConvertibleConsumable(
        withDefaultContractInfo({ name: 'the name' }),
        '',
        consumable.address,
        0,
        false,
        roleDelegate,
        { from: CONSUMABLE_MINTER },
      ),
      'exchange rate must be > 0',
    );
  });

  it('should revert if called twice', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await createConsumable();

    const convertibleConsumable = await ConvertibleConsumableContract.new();
    await convertibleConsumable.initializeConvertibleConsumable(
      withDefaultContractInfo({ name: 'the name' }),
      '',
      consumable.address,
      1,
      false,
      roleDelegate,
      { from: CONSUMABLE_MINTER },
    );

    await expectRevert(
      convertibleConsumable.initializeConvertibleConsumable(
        withDefaultContractInfo({ name: 'the new name' }),
        '',
        consumable.address,
        1,
        false,
        roleDelegate,
        { from: CONSUMABLE_MINTER },
      ),
      'Contract instance has already been initialized',
    );

    expect<string>(await convertibleConsumable.name()).toEqual('the name');
  });
});

describe('mint', () => {
  it('should give coins to the player', async () => {
    const consumable = await createConsumable();

    const convertibleConsumable = await createConvertibleConsumable(consumable.address, {}, '', 1, false);

    await mintConsumable(consumable, convertibleConsumable.address, 150);

    await convertibleConsumable.mint(PLAYER1, 100, { from: CONSUMABLE_MINTER });
    await convertibleConsumable.mint(PLAYER2, 50, { from: CONSUMABLE_MINTER });

    const result1 = await getBalance(convertibleConsumable, PLAYER1);
    expect<number>(result1).toEqual(100);

    const result2 = await getBalance(convertibleConsumable, PLAYER2);
    expect<number>(result2).toEqual(50);

    const result3 = await getBalance(convertibleConsumable, PLAYER3);
    expect<number>(result3).toEqual(0);
  });

  it('should increase total supply', async () => {
    const consumable = await createConsumable();

    const convertibleConsumable = await createConvertibleConsumable(consumable.address, {}, '', 1, false);

    await mintConsumable(consumable, convertibleConsumable.address, 150);

    await convertibleConsumable.mint(PLAYER1, 100, { from: CONSUMABLE_MINTER });
    await convertibleConsumable.mint(PLAYER2, 50, { from: CONSUMABLE_MINTER });

    const result1 = await toNumberAsync(convertibleConsumable.totalSupply());
    expect<number>(result1).toEqual(150);
  });

  it('should not mint the token if there is not enough exchange', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 1000, true);
    const consumable2 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 2' },
      '',
      1_000_000,
      true,
    );

    await expectRevert(mintConsumable(consumable1, PLAYER1, 1), 'Not enough exchange token available to mint');

    await mintConsumable(exchange, consumable1.address, 1);
    await expectRevert(mintConsumable(consumable1, PLAYER1, 1_001), 'Not enough exchange token available to mint');

    await mintConsumable(exchange, consumable1.address, 999);
    await expectRevert(mintConsumable(consumable1, PLAYER1, 1_000_001), 'Not enough exchange token available to mint');

    await expectRevert(mintConsumable(consumable2, PLAYER1, 1), 'Not enough exchange token available to mint');

    await mintConsumable(exchange, consumable2.address, 1);
    await expectRevert(mintConsumable(consumable2, PLAYER1, 1_000_001), 'Not enough exchange token available to mint');

    await mintConsumable(exchange, consumable2.address, 999);
    await expectRevert(
      mintConsumable(consumable2, PLAYER1, 1_000_000_001),
      'Not enough exchange token available to mint',
    );
  });

  it('should not mint coins if not the minter', async () => {
    const consumable = await createConsumable();

    const convertibleConsumable = await createConvertibleConsumable(consumable.address, {}, '', 1, false);

    await expectRevert(
      convertibleConsumable.mint(PLAYER1, 100, { from: PLAYER2 }),
      'Caller does not have the Minter role',
    );

    const result1 = await getBalance(convertibleConsumable, PLAYER1);
    expect<number>(result1).toEqual(0);

    const result2 = await getBalance(convertibleConsumable, PLAYER2);
    expect<number>(result2).toEqual(0);
  });
});

describe('Enable/Disable', () => {
  const create = async () => {
    const consumable = await createConsumable();
    return createConvertibleConsumable(consumable.address, {}, '', 1, false);
  };

  shouldRestrictEnableAndDisable(create, CONSUMABLE_MINTER);
});

describe('transferToken', () => {
  const create = async () => {
    const consumable = await createConsumable();
    return createConvertibleConsumable(consumable.address, {}, '', 1, false);
  };

  shouldTransferToken(create, { superAdmin: CONSUMABLE_MINTER });
});

describe('transferItem', () => {
  const create = async () => {
    const consumable = await createConsumable();
    return createConvertibleConsumable(consumable.address, {}, '', 1, false);
  };

  shouldTransferItem(create, { superAdmin: CONSUMABLE_MINTER });
});