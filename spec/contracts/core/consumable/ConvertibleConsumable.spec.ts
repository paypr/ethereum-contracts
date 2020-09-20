import { expectRevert } from '@openzeppelin/test-helpers';
import { CONSUMABLE_MINTER, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import {
  createConsumable,
  createConsumableExchange,
  createConvertibleConsumable,
  getAllowance,
  getBalance,
  increaseAllowance,
  mintConsumable,
} from '../../../helpers/ConsumableHelper';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import {
  BASE_CONTRACT_ID,
  CONSUMABLE_ID,
  CONVERTIBLE_CONSUMABLE_ID,
  ERC165_ID,
  TRANSFERRING_ID,
} from '../../../helpers/ContractIds';
import { disableContract } from '../../../helpers/DisableableHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165';

describe('supportsInterface', () => {
  const create = async () => {
    const consumable = await createConsumable();
    return createConvertibleConsumable(consumable.address, {}, '', 1, false);
  };

  shouldSupportInterface('ERC165', create, ERC165_ID);
  shouldSupportInterface('BaseContract', create, BASE_CONTRACT_ID);
  shouldSupportInterface('Consumable', create, CONSUMABLE_ID);
  shouldSupportInterface('ConvertibleConsumable', create, CONVERTIBLE_CONSUMABLE_ID);
  shouldSupportInterface('Transfer', create, TRANSFERRING_ID);
});

describe('exchangeToken', () => {
  it('should return the address of the exchange token', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible' },
      '',
      1,
      false,
    );

    expect<string>(await convertibleConsumable.exchangeToken()).toEqual(consumable.address);
  });
});

describe('exchangeRate', () => {
  it('should return the exchange rate', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible' },
      '',
      92,
      false,
    );

    expect<number>(await toNumberAsync(convertibleConsumable.exchangeRate())).toEqual(92);
  });
});

describe('amountExchangeTokenAvailable', () => {
  it('should return the amount available when exchange rate is 1', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });
    const convertibleConsumable = await createConvertibleConsumable(exchange.address, { name: 'Convertible' }, '', 1);

    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenAvailable())).toEqual(0);

    await mintConsumable(exchange, convertibleConsumable.address, 10);

    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenAvailable())).toEqual(10);

    await mintConsumable(convertibleConsumable, PLAYER1, 5);

    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenAvailable())).toEqual(5);

    await mintConsumable(convertibleConsumable, PLAYER1, 5);

    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenAvailable())).toEqual(0);
  });

  it('should return the amount available when exchange rate is large', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });
    const convertibleConsumable = await createConvertibleConsumable(
      exchange.address,
      { name: 'Convertible' },
      '',
      1000,
    );

    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenAvailable())).toEqual(0);

    await mintConsumable(exchange, convertibleConsumable.address, 10);

    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenAvailable())).toEqual(10);

    await mintConsumable(convertibleConsumable, PLAYER1, 5000);

    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenAvailable())).toEqual(5);

    await mintConsumable(convertibleConsumable, PLAYER1, 5000);

    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenAvailable())).toEqual(0);
  });
});

describe('amountExchangeTokenNeeded', () => {
  it('should return the amount needed when exchange rate is 1', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });
    const convertibleConsumable = await createConvertibleConsumable(exchange.address, { name: 'Convertible' }, '', 1);

    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenNeeded(0))).toEqual(0);
    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenNeeded(1))).toEqual(1);
    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenNeeded(100))).toEqual(100);
  });

  it('should return the amount needed when exchange rate is large', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });
    const convertibleConsumable = await createConvertibleConsumable(
      exchange.address,
      { name: 'Convertible' },
      '',
      1000,
    );

    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenNeeded(0))).toEqual(0);
    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenNeeded(1))).toEqual(1);
    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenNeeded(999))).toEqual(1);
    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenNeeded(1000))).toEqual(1);
    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenNeeded(1001))).toEqual(2);
    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenNeeded(2000))).toEqual(2);
    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenNeeded(10000))).toEqual(10);
  });
});

describe('amountExchangeTokenProvided', () => {
  it('should return the amount provided when exchange rate is 1', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });
    const convertibleConsumable = await createConvertibleConsumable(exchange.address, { name: 'Convertible' }, '', 1);

    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenProvided(0))).toEqual(0);
    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenProvided(1))).toEqual(1);
    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenProvided(100))).toEqual(100);
  });

  it('should return the amount provided when exchange rate is large', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });
    const convertibleConsumable = await createConvertibleConsumable(
      exchange.address,
      { name: 'Convertible' },
      '',
      1000,
    );

    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenProvided(0))).toEqual(0);
    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenProvided(1))).toEqual(0);
    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenProvided(999))).toEqual(0);
    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenProvided(1000))).toEqual(1);
    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenProvided(1001))).toEqual(1);
    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenProvided(2000))).toEqual(2);
    expect<number>(await toNumberAsync(convertibleConsumable.amountExchangeTokenProvided(10000))).toEqual(10);
  });
});

describe('mintByExchange', () => {
  it('should exchange proper amount when the exchange rate is 1', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1,
      false,
    );

    await mintConsumable(consumable1, PLAYER1, 1000);
    await mintConsumable(consumable2, PLAYER1, 1000);

    await increaseAllowance(consumable1, PLAYER1, convertibleConsumable.address, 100);

    await convertibleConsumable.mintByExchange(100, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(900);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(100);

    await increaseAllowance(consumable1, PLAYER1, convertibleConsumable.address, 50);

    await convertibleConsumable.mintByExchange(50, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(850);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(150);
  });

  it('should exchange proper amount when the exchange rate is large', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1000,
      false,
    );

    await mintConsumable(consumable1, PLAYER1, 1000);
    await mintConsumable(consumable2, PLAYER1, 1000);

    await increaseAllowance(consumable1, PLAYER1, convertibleConsumable.address, 100);

    await convertibleConsumable.mintByExchange(100_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(900);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(100_000);

    await increaseAllowance(consumable1, PLAYER1, convertibleConsumable.address, 50);

    await convertibleConsumable.mintByExchange(50_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(850);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(150_000);
  });

  it('should revert if the sender does not allow the correct exchangeToken balance of the sender when the exchange rate is 1', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1,
      false,
    );

    await mintConsumable(consumable1, PLAYER1, 1000);
    await mintConsumable(consumable2, PLAYER1, 1000);

    await expectRevert(
      convertibleConsumable.mintByExchange(100, { from: PLAYER1 }),
      'transfer amount exceeds allowance',
    );

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(0);

    await increaseAllowance(consumable1, PLAYER1, convertibleConsumable.address, 99);

    await expectRevert(
      convertibleConsumable.mintByExchange(100, { from: PLAYER1 }),
      'transfer amount exceeds allowance',
    );

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, convertibleConsumable.address)).toEqual(99);
    expect<number>(await getAllowance(consumable2, PLAYER1, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(0);
  });

  it('should revert if the sender does not allow the correct exchangeToken balance of the sender when the exchange rate is large', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1000,
      false,
    );

    await mintConsumable(consumable1, PLAYER1, 1000);
    await mintConsumable(consumable2, PLAYER1, 1000);

    await expectRevert(
      convertibleConsumable.mintByExchange(100000, { from: PLAYER1 }),
      'transfer amount exceeds allowance',
    );

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(0);

    await increaseAllowance(consumable1, PLAYER1, convertibleConsumable.address, 99);

    await expectRevert(
      convertibleConsumable.mintByExchange(100000, { from: PLAYER1 }),
      'transfer amount exceeds allowance',
    );

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, convertibleConsumable.address)).toEqual(99);
    expect<number>(await getAllowance(consumable2, PLAYER1, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(0);
  });

  it('should not exchange if disabled', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1,
      false,
    );

    await mintConsumable(consumable1, PLAYER1, 1000);
    await mintConsumable(consumable2, PLAYER1, 1000);

    await increaseAllowance(consumable1, PLAYER1, convertibleConsumable.address, 100);

    await disableContract(convertibleConsumable, CONSUMABLE_MINTER);

    await expectRevert(convertibleConsumable.mintByExchange(100, { from: PLAYER1 }), 'Contract is disabled');
  });
});

describe('burnByExchange', () => {
  it('should exchange proper amount when the exchange rate is 1', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1,
      false,
    );

    await mintConsumable(consumable1, convertibleConsumable.address, 1000);
    await mintConsumable(consumable2, convertibleConsumable.address, 1000);
    await mintConsumable(convertibleConsumable, PLAYER1, 1000);

    await convertibleConsumable.burnByExchange(100, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, convertibleConsumable.address)).toEqual(1000);
    expect<number>(await getBalance(consumable2, convertibleConsumable.address)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, convertibleConsumable.address, PLAYER1)).toEqual(100);
    expect<number>(await getAllowance(consumable2, convertibleConsumable.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(900);

    await consumable1.transferFrom(convertibleConsumable.address, PLAYER1, 100, { from: PLAYER1 });

    await convertibleConsumable.burnByExchange(50, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, convertibleConsumable.address)).toEqual(900);
    expect<number>(await getBalance(consumable2, convertibleConsumable.address)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, convertibleConsumable.address, PLAYER1)).toEqual(50);
    expect<number>(await getAllowance(consumable2, convertibleConsumable.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(850);
  });

  it('should exchange proper amount when the exchange rate is large', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1000,
      false,
    );

    await mintConsumable(consumable1, convertibleConsumable.address, 1000);
    await mintConsumable(consumable2, convertibleConsumable.address, 1000);
    await mintConsumable(convertibleConsumable, PLAYER1, 1_000_000);

    await convertibleConsumable.burnByExchange(100_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, convertibleConsumable.address)).toEqual(1000);
    expect<number>(await getBalance(consumable2, convertibleConsumable.address)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, convertibleConsumable.address, PLAYER1)).toEqual(100);
    expect<number>(await getAllowance(consumable2, convertibleConsumable.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(900_000);

    await consumable1.transferFrom(convertibleConsumable.address, PLAYER1, 100, { from: PLAYER1 });

    await convertibleConsumable.burnByExchange(50_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, convertibleConsumable.address)).toEqual(900);
    expect<number>(await getBalance(consumable2, convertibleConsumable.address)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, convertibleConsumable.address, PLAYER1)).toEqual(50);
    expect<number>(await getAllowance(consumable2, convertibleConsumable.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(850_000);
  });

  it('should revert if the sender does not have enough token to burn when the exchange rate is 1', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1,
      false,
    );

    await mintConsumable(consumable1, convertibleConsumable.address, 1000);
    await mintConsumable(consumable2, convertibleConsumable.address, 1000);

    await expectRevert(convertibleConsumable.burnByExchange(100, { from: PLAYER1 }), 'burn amount exceeds balance');

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, convertibleConsumable.address)).toEqual(1000);
    expect<number>(await getBalance(consumable2, convertibleConsumable.address)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, convertibleConsumable.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable2, convertibleConsumable.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(0);

    await mintConsumable(convertibleConsumable, PLAYER1, 99);

    await expectRevert(convertibleConsumable.burnByExchange(100, { from: PLAYER1 }), 'burn amount exceeds balance');

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, convertibleConsumable.address)).toEqual(1000);
    expect<number>(await getBalance(consumable2, convertibleConsumable.address)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, convertibleConsumable.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable2, convertibleConsumable.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(99);
  });

  it('should revert if the sender does not have enough token to burn when the exchange rate is large', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1000,
      false,
    );

    await mintConsumable(consumable1, convertibleConsumable.address, 1_000_000);
    await mintConsumable(consumable2, convertibleConsumable.address, 1_000_000);

    await expectRevert(convertibleConsumable.burnByExchange(100_000, { from: PLAYER1 }), 'burn amount exceeds balance');

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, convertibleConsumable.address)).toEqual(1_000_000);
    expect<number>(await getBalance(consumable2, convertibleConsumable.address)).toEqual(1_000_000);
    expect<number>(await getAllowance(consumable1, convertibleConsumable.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable2, convertibleConsumable.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(0);

    await mintConsumable(convertibleConsumable, PLAYER1, 99_999);

    await expectRevert(convertibleConsumable.burnByExchange(100_000, { from: PLAYER1 }), 'burn amount exceeds balance');

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, convertibleConsumable.address)).toEqual(1_000_000);
    expect<number>(await getBalance(consumable2, convertibleConsumable.address)).toEqual(1_000_000);
    expect<number>(await getAllowance(consumable1, convertibleConsumable.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable2, convertibleConsumable.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(99_999);
  });

  it('should not exchange if disabled', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable1.address,
      { name: 'Convertible' },
      '',
      1,
      false,
    );

    await mintConsumable(consumable1, convertibleConsumable.address, 1000);
    await mintConsumable(consumable2, convertibleConsumable.address, 1000);
    await mintConsumable(convertibleConsumable, PLAYER1, 1000);

    await disableContract(convertibleConsumable, CONSUMABLE_MINTER);

    await expectRevert(convertibleConsumable.burnByExchange(100, { from: PLAYER1 }), 'Contract is disabled');
  });
});

describe('transfer', () => {
  it('should mint tokens when needed', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible' },
      '',
      1000,
      false,
    );

    await mintConsumable(consumable, PLAYER1, 1000);

    await increaseAllowance(consumable, PLAYER1, convertibleConsumable.address, 100);

    await convertibleConsumable.transfer(PLAYER2, 100_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(900);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(0);
    expect<number>(await getBalance(consumable, convertibleConsumable.address)).toEqual(100);
    expect<number>(await getAllowance(consumable, PLAYER1, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER2)).toEqual(100_000);

    await increaseAllowance(consumable, PLAYER1, convertibleConsumable.address, 25);

    await mintConsumable(consumable, convertibleConsumable.address, 25);
    await mintConsumable(convertibleConsumable, PLAYER1, 25_000);

    await convertibleConsumable.transfer(PLAYER2, 50_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(875);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(0);
    expect<number>(await getBalance(consumable, convertibleConsumable.address)).toEqual(150);
    expect<number>(await getAllowance(consumable, PLAYER1, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER2)).toEqual(150_000);
  });

  it('should not mint tokens when not needed', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible' },
      '',
      1000,
      false,
    );

    await mintConsumable(consumable, PLAYER1, 1000);

    await mintConsumable(consumable, convertibleConsumable.address, 1000);
    await mintConsumable(convertibleConsumable, PLAYER1, 1_000_000);

    await convertibleConsumable.transfer(PLAYER2, 100_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(0);
    expect<number>(await getBalance(consumable, convertibleConsumable.address)).toEqual(1000);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(900_000);
    expect<number>(await getBalance(convertibleConsumable, PLAYER2)).toEqual(100_000);

    await convertibleConsumable.transfer(PLAYER2, 50_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(0);
    expect<number>(await getBalance(consumable, convertibleConsumable.address)).toEqual(1000);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(850_000);
    expect<number>(await getBalance(convertibleConsumable, PLAYER2)).toEqual(150_000);
  });

  it('should revert if there are not enough tokens or exchange tokens', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });
    const convertibleConsumable = await createConvertibleConsumable(
      consumable.address,
      { name: 'Convertible' },
      '',
      1000,
      false,
    );

    await mintConsumable(consumable, PLAYER1, 1000);

    await expectRevert(
      convertibleConsumable.transfer(PLAYER2, 100_000, { from: PLAYER1 }),
      'transfer amount exceeds allowance',
    );

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(0);
    expect<number>(await getBalance(consumable, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER2)).toEqual(0);

    await increaseAllowance(consumable, PLAYER1, convertibleConsumable.address, 99);

    await expectRevert(
      convertibleConsumable.transfer(PLAYER2, 100_000, { from: PLAYER1 }),
      'transfer amount exceeds allowance',
    );

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(0);
    expect<number>(await getBalance(consumable, convertibleConsumable.address)).toEqual(0);
    expect<number>(await getAllowance(consumable, PLAYER1, convertibleConsumable.address)).toEqual(99);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(convertibleConsumable, PLAYER2)).toEqual(0);

    await mintConsumable(consumable, convertibleConsumable.address, 1);
    await mintConsumable(convertibleConsumable, PLAYER1, 999);

    await expectRevert(
      convertibleConsumable.transfer(PLAYER2, 100_000, { from: PLAYER1 }),
      'transfer amount exceeds allowance',
    );

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(0);
    expect<number>(await getBalance(consumable, convertibleConsumable.address)).toEqual(1);
    expect<number>(await getAllowance(consumable, PLAYER1, convertibleConsumable.address)).toEqual(99);
    expect<number>(await getBalance(convertibleConsumable, PLAYER1)).toEqual(999);
    expect<number>(await getBalance(convertibleConsumable, PLAYER2)).toEqual(0);
  });
});
