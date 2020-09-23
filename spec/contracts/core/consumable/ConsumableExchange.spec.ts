import { expectEvent, expectRevert } from '@openzeppelin/test-helpers';
import { ExchangeRate } from '../../../../dist/consumables';
import { CONSUMABLE_MINTER, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import {
  createConsumable,
  createConsumableExchange,
  createConvertibleConsumable,
  getAllowance,
  getBalance,
  increaseAllowance,
  mintConsumable,
  toExchangeRateAsync,
} from '../../../helpers/ConsumableHelper';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import {
  BASE_CONTRACT_ID,
  CONSUMABLE_EXCHANGE_ID,
  CONSUMABLE_ID,
  ERC165_ID,
  TRANSFERRING_ID,
} from '../../../helpers/ContractIds';
import { disableContract } from '../../../helpers/DisableableHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createConsumableExchange, ERC165_ID);
  shouldSupportInterface('BaseContract', createConsumableExchange, BASE_CONTRACT_ID);
  shouldSupportInterface('Consumable', createConsumableExchange, CONSUMABLE_ID);
  shouldSupportInterface('ConsumableExchange', createConsumableExchange, CONSUMABLE_EXCHANGE_ID);
  shouldSupportInterface('Transfer', createConsumableExchange, TRANSFERRING_ID);
});

describe('totalConvertibles', () => {
  it('should return all convertibles that are registered', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    expect(await toNumberAsync(exchange.totalConvertibles())).toEqual(0);

    await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' });
    expect(await toNumberAsync(exchange.totalConvertibles())).toEqual(1);

    await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1, 1, false);
    expect(await toNumberAsync(exchange.totalConvertibles())).toEqual(1);

    await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' });
    expect(await toNumberAsync(exchange.totalConvertibles())).toEqual(2);
  });
});

describe('convertibleAt', () => {
  it('should return the convertible at the proper index', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' });
    expect(await exchange.convertibleAt(0)).toEqual(consumable1.address);

    await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1, 1, false);
    expect(await exchange.convertibleAt(0)).toEqual(consumable1.address);

    const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' });
    expect(await exchange.convertibleAt(0)).toEqual(consumable1.address);
    expect(await exchange.convertibleAt(1)).toEqual(consumable3.address);
  });

  it('should revert for index out of bounds', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' });
    await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1, 1, false);
    await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' });

    await expectRevert(exchange.convertibleAt(2), 'index out of bounds');
    await expectRevert(exchange.convertibleAt(10), 'index out of bounds');
    await expectRevert(exchange.convertibleAt(-1), 'index out of bounds');
  });
});

describe('isConvertible', () => {
  it('should return false if not registered', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });

    expect<boolean>(await exchange.isConvertible(consumable1.address)).toBe(false);
    expect<boolean>(await exchange.isConvertible(consumable2.address)).toBe(false);
  });

  it('should return true if registered', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConsumable({ name: 'Consumable 1' });

    const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1000);

    expect<boolean>(await exchange.isConvertible(consumable1.address)).toBe(false);
    expect<boolean>(await exchange.isConvertible(consumable2.address)).toBe(true);

    const consumable3 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 3' }, '', 1000);

    expect<boolean>(await exchange.isConvertible(consumable1.address)).toBe(false);
    expect<boolean>(await exchange.isConvertible(consumable2.address)).toBe(true);
    expect<boolean>(await exchange.isConvertible(consumable3.address)).toBe(true);
  });
});

describe('exchangeRateOf', () => {
  it('should return 0 if not set', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });

    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable1.address))).toEqual({
      purchasePrice: 0,
      intrinsicValue: 0,
    });
    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable2.address))).toEqual({
      purchasePrice: 0,
      intrinsicValue: 0,
    });
  });

  it('should return the exchange rate of the token', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConsumable({ name: 'Consumable 1' });

    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable1.address))).toEqual({
      purchasePrice: 0,
      intrinsicValue: 0,
    });

    const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1000, 2000);

    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable1.address))).toEqual({
      purchasePrice: 0,
      intrinsicValue: 0,
    });
    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable2.address))).toEqual({
      purchasePrice: 1000,
      intrinsicValue: 2000,
    });

    const consumable3 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 3' },
      '',
      1_000_000,
      2_000_000,
    );

    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable1.address))).toEqual({
      purchasePrice: 0,
      intrinsicValue: 0,
    });
    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable2.address))).toEqual({
      purchasePrice: 1000,
      intrinsicValue: 2000,
    });
    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable3.address))).toEqual({
      purchasePrice: 1_000_000,
      intrinsicValue: 2_000_000,
    });
  });
});

describe('registerToken', () => {
  it('should set the exchange rate for a new token', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 1' },
      '',
      1000,
      2000,
      false,
    );

    const consumable2 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 2' },
      '',
      1_000_000,
      2_000_000,
      false,
    );

    await consumable1.registerWithExchange({ from: CONSUMABLE_MINTER });

    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable1.address))).toEqual({
      purchasePrice: 1000,
      intrinsicValue: 2000,
    });
    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable2.address))).toEqual({
      purchasePrice: 0,
      intrinsicValue: 0,
    });

    await consumable2.registerWithExchange({ from: CONSUMABLE_MINTER });

    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable1.address))).toEqual({
      purchasePrice: 1000,
      intrinsicValue: 2000,
    });
    expect<ExchangeRate>(await toExchangeRateAsync(exchange.exchangeRateOf(consumable2.address))).toEqual({
      purchasePrice: 1_000_000,
      intrinsicValue: 2_000_000,
    });
  });

  it.skip('should emit ExchangeRateChanged event', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 1' },
      '',
      1000,
      2000,
      false,
    );

    const consumable2 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 2' },
      '',
      1_000_000,
      2_000_000,
      false,
    );

    // todo: skipped until events from nested calls can be checked
    expectEvent(await consumable1.registerWithExchange({ from: CONSUMABLE_MINTER }), 'ExchangeRateChanged', {
      token: consumable1.address,
      purchasePriceExchangeRate: 1000,
      intrinsicValueExchangeRate: 2000,
    });
    expectEvent(await consumable2.registerWithExchange({ from: CONSUMABLE_MINTER }), 'ExchangeRateChanged', {
      token: consumable1.address,
      purchasePriceExchangeRate: 1_000_000,
      intrinsicValueExchangeRate: 2_000_000,
    });
  });

  it('should revert if exchange rate is 0', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    await expectRevert(
      exchange.registerToken(0, 1, { from: PLAYER1 }),
      'must register with a purchase price exchange rate',
    );
    await expectRevert(
      exchange.registerToken(1, 0, { from: PLAYER1 }),
      'must register with an intrinsic value exchange rate',
    );
  });

  it('should revert if the token is already registered', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 1' },
      '',
      1000,
      1000,
      false,
    );

    await consumable1.registerWithExchange({ from: CONSUMABLE_MINTER });
    await expectRevert(
      consumable1.registerWithExchange({ from: CONSUMABLE_MINTER }),
      'cannot register already registered token',
    );
  });

  it('should not register if disabled', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable' },
      '',
      1000,
      1000,
      false,
    );

    await disableContract(exchange, CONSUMABLE_MINTER);

    await expectRevert(consumable.registerWithExchange({ from: CONSUMABLE_MINTER }), 'Contract is disabled');
  });
});

describe('exchangeTo', () => {
  it('should exchange the token at the exchange rate', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 1000, 2000);
    const consumable2 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 2' },
      '',
      1_000_000,
      2_000_000,
    );

    await mintConsumable(exchange, PLAYER1, 1000);
    await exchange.exchangeTo(consumable1.address, 2, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable1, exchange.address, PLAYER1)).toEqual(2000);
    expect<number>(await getAllowance(consumable2, exchange.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(998);
    expect<number>(await getBalance(exchange, consumable1.address)).toEqual(2);
    expect<number>(await getBalance(exchange, consumable2.address)).toEqual(0);

    await consumable1.transferFrom(exchange.address, PLAYER1, 2000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(2000);

    await exchange.exchangeTo(consumable2.address, 50, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(2000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable1, exchange.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable2, exchange.address, PLAYER1)).toEqual(50_000_000);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(948);
    expect<number>(await getBalance(exchange, consumable1.address)).toEqual(2);
    expect<number>(await getBalance(exchange, consumable2.address)).toEqual(50);

    await consumable2.transferFrom(exchange.address, PLAYER1, 50_000_000, { from: PLAYER1 });

    await exchange.exchangeTo(consumable1.address, 100, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(2000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(50_000_000);
    expect<number>(await getAllowance(consumable1, exchange.address, PLAYER1)).toEqual(100_000);
    expect<number>(await getAllowance(consumable2, exchange.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(848);
    expect<number>(await getBalance(exchange, consumable1.address)).toEqual(102);
    expect<number>(await getBalance(exchange, consumable2.address)).toEqual(50);

    await consumable1.transferFrom(exchange.address, PLAYER1, 100_000, { from: PLAYER1 });
  });

  it('should revert if the caller does not have enough of the exchange token', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 1000, 2000);
    const consumable2 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 2' },
      '',
      1_000_000,
      2_000_000,
    );

    await expectRevert(
      exchange.exchangeTo(consumable1.address, 100, { from: PLAYER1 }),
      'transfer amount exceeds balance',
    );

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable1, exchange.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable2, exchange.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(exchange, consumable1.address)).toEqual(0);
    expect<number>(await getBalance(exchange, consumable2.address)).toEqual(0);

    await mintConsumable(exchange, PLAYER1, 99);

    await expectRevert(
      exchange.exchangeTo(consumable1.address, 100, { from: PLAYER1 }),
      'transfer amount exceeds balance',
    );

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable1, exchange.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable2, exchange.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(99);
    expect<number>(await getBalance(exchange, consumable1.address)).toEqual(0);
    expect<number>(await getBalance(exchange, consumable2.address)).toEqual(0);

    await mintConsumable(exchange, PLAYER2, 1000);

    await expectRevert(
      exchange.exchangeTo(consumable1.address, 100, { from: PLAYER1 }),
      'transfer amount exceeds balance',
    );

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable1, exchange.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable2, exchange.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(99);
    expect<number>(await getBalance(exchange, consumable1.address)).toEqual(0);
    expect<number>(await getBalance(exchange, consumable2.address)).toEqual(0);
  });

  it.skip('should revert if the token contract does not send enough tokens', async () => {
    // todo: need a test consumable that doesn't send enough tokens
  });

  it('should not exchange the token if disabled', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable = await createConvertibleConsumable(exchange.address, { name: 'Consumable' }, '', 1000);

    await mintConsumable(exchange, PLAYER1, 1000);

    await disableContract(exchange, CONSUMABLE_MINTER);

    await expectRevert(exchange.exchangeTo(consumable.address, 100, { from: PLAYER1 }), 'Contract is disabled');
  });
});

describe('exchangeFrom', () => {
  it('should exchange the token at the exchange rate', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 100, 1000);
    const consumable2 = await createConvertibleConsumable(
      exchange.address,
      { name: 'Consumable 2' },
      '',
      1000,
      1_000_000,
    );

    await mintConsumable(exchange, consumable1.address, 10_000);
    await mintConsumable(consumable1, PLAYER1, 1_000_000);

    await mintConsumable(exchange, consumable2.address, 1_000_000);
    await mintConsumable(consumable2, PLAYER1, 1_000_000_000);

    await increaseAllowance(consumable1, PLAYER1, exchange.address, 100_000);

    await exchange.exchangeFrom(consumable1.address, 100_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(900_000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1_000_000_000);
    expect<number>(await getAllowance(consumable1, PLAYER1, exchange.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, exchange.address)).toEqual(0);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(exchange, consumable1.address)).toEqual(9900);
    expect<number>(await getBalance(exchange, consumable2.address)).toEqual(1_000_000);

    await increaseAllowance(consumable2, PLAYER1, exchange.address, 200_000_000);

    await exchange.exchangeFrom(consumable2.address, 200_000_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(900_000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(800_000_000);
    expect<number>(await getAllowance(consumable1, PLAYER1, exchange.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, exchange.address)).toEqual(0);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(300);
    expect<number>(await getBalance(exchange, consumable1.address)).toEqual(9900);
    expect<number>(await getBalance(exchange, consumable2.address)).toEqual(999_800);

    await increaseAllowance(consumable1, PLAYER1, exchange.address, 1500);

    await exchange.exchangeFrom(consumable1.address, 1500, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(898_500);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(800_000_000);
    expect<number>(await getAllowance(consumable1, PLAYER1, exchange.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, exchange.address)).toEqual(0);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(301);
    expect<number>(await getBalance(exchange, consumable1.address)).toEqual(9899);
    expect<number>(await getBalance(exchange, consumable2.address)).toEqual(999_800);
  });

  it('should revert if the caller has not provided enough tokens', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable1 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 1' }, '', 1000);
    const consumable2 = await createConvertibleConsumable(exchange.address, { name: 'Consumable 2' }, '', 1_000_000);

    await mintConsumable(exchange, consumable1.address, 1000);
    await mintConsumable(consumable1, PLAYER1, 1_000_000);

    await mintConsumable(exchange, consumable2.address, 1000);
    await mintConsumable(consumable2, PLAYER1, 1_000_000_000);

    await expectRevert(
      exchange.exchangeFrom(consumable1.address, 100_000, { from: PLAYER1 }),
      'transfer amount exceeds allowance',
    );

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1_000_000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1_000_000_000);
    expect<number>(await getAllowance(consumable1, PLAYER1, exchange.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, exchange.address)).toEqual(0);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(exchange, consumable1.address)).toEqual(1000);
    expect<number>(await getBalance(exchange, consumable2.address)).toEqual(1000);

    await increaseAllowance(consumable1, PLAYER1, exchange.address, 99_999);

    await expectRevert(
      exchange.exchangeFrom(consumable1.address, 100_000, { from: PLAYER1 }),
      'transfer amount exceeds allowance',
    );

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1_000_000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1_000_000_000);
    expect<number>(await getAllowance(consumable1, PLAYER1, exchange.address)).toEqual(99_999);
    expect<number>(await getAllowance(consumable2, PLAYER1, exchange.address)).toEqual(0);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(exchange, consumable1.address)).toEqual(1000);
    expect<number>(await getBalance(exchange, consumable2.address)).toEqual(1000);

    await increaseAllowance(consumable2, PLAYER1, exchange.address, 1_000_000);

    await expectRevert(
      exchange.exchangeFrom(consumable1.address, 100_000, { from: PLAYER1 }),
      'transfer amount exceeds allowance',
    );

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1_000_000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1_000_000_000);
    expect<number>(await getAllowance(consumable1, PLAYER1, exchange.address)).toEqual(99_999);
    expect<number>(await getAllowance(consumable2, PLAYER1, exchange.address)).toEqual(1_000_000);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(exchange, consumable1.address)).toEqual(1000);
    expect<number>(await getBalance(exchange, consumable2.address)).toEqual(1000);
  });

  it.skip('should revert if the token contract does not have enough of the exchange token', async () => {
    // todo: need a test consumable that doesn't send enough tokens
  });

  it('should not exchange the token if disabled', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable = await createConvertibleConsumable(exchange.address, { name: 'Consumable' }, '', 1000);

    await mintConsumable(exchange, consumable.address, 1000);
    await mintConsumable(consumable, PLAYER1, 1_000_000);

    await increaseAllowance(consumable, PLAYER1, exchange.address, 100_000);

    await disableContract(exchange, CONSUMABLE_MINTER);

    await expectRevert(exchange.exchangeFrom(consumable.address, 100_000, { from: PLAYER1 }), 'Contract is disabled');
  });
});

describe('transferToken', () => {
  shouldTransferToken(createConsumableExchange, { superAdmin: CONSUMABLE_MINTER });

  it('should transfer from consumable if there would be enough to exchangeFrom', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable = await createConvertibleConsumable(exchange.address, { name: 'Consumable' }, '', 1000);

    await mintConsumable(exchange, PLAYER1, 1000);
    await mintConsumable(exchange, consumable.address, 10);

    await exchange.exchangeTo(consumable.address, 2, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable, exchange.address, PLAYER1)).toEqual(2000);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(998);
    expect<number>(await getBalance(exchange, consumable.address)).toEqual(12);

    await consumable.transferFrom(exchange.address, PLAYER1, 2000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(2000);
    expect<number>(await getAllowance(consumable, exchange.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(998);
    expect<number>(await getBalance(exchange, consumable.address)).toEqual(12);

    await consumable.transferToken(exchange.address, 5, PLAYER1, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(1003);
    expect<number>(await getBalance(exchange, consumable.address)).toEqual(7);

    await exchange.exchangeTo(consumable.address, 100, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(2000);
    expect<number>(await getAllowance(consumable, exchange.address, PLAYER1)).toEqual(100_000);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(903);
    expect<number>(await getBalance(exchange, consumable.address)).toEqual(107);

    await consumable.transferFrom(exchange.address, PLAYER1, 100_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(102_000);
    expect<number>(await getAllowance(consumable, exchange.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(903);
    expect<number>(await getBalance(exchange, consumable.address)).toEqual(107);

    await consumable.transferToken(exchange.address, 5, PLAYER1, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(908);
    expect<number>(await getBalance(exchange, consumable.address)).toEqual(102);
  });

  it('should not transfer from consumable if there would not be enough to exchangeFrom', async () => {
    const exchange = await createConsumableExchange({ name: 'Exchange' });

    const consumable = await createConvertibleConsumable(exchange.address, { name: 'Consumable' }, '', 1000);

    await mintConsumable(exchange, PLAYER1, 1000);

    await exchange.exchangeTo(consumable.address, 2, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable, exchange.address, PLAYER1)).toEqual(2000);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(998);
    expect<number>(await getBalance(exchange, consumable.address)).toEqual(2);

    await consumable.transferFrom(exchange.address, PLAYER1, 2000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(2000);
    expect<number>(await getAllowance(consumable, exchange.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(998);
    expect<number>(await getBalance(exchange, consumable.address)).toEqual(2);

    await expectRevert(
      consumable.transferToken(exchange.address, 2, PLAYER1, { from: CONSUMABLE_MINTER }),
      'not enough left to cover exchange',
    );

    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(998);
    expect<number>(await getBalance(exchange, consumable.address)).toEqual(2);

    await exchange.exchangeTo(consumable.address, 100, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(2000);
    expect<number>(await getAllowance(consumable, exchange.address, PLAYER1)).toEqual(100_000);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(898);
    expect<number>(await getBalance(exchange, consumable.address)).toEqual(102);

    await consumable.transferFrom(exchange.address, PLAYER1, 100_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(102_000);
    expect<number>(await getAllowance(consumable, exchange.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(898);
    expect<number>(await getBalance(exchange, consumable.address)).toEqual(102);

    await expectRevert(
      consumable.transferToken(exchange.address, 10, PLAYER1, { from: CONSUMABLE_MINTER }),
      'not enough left to cover exchange',
    );

    expect<number>(await getBalance(exchange, PLAYER1)).toEqual(898);
    expect<number>(await getBalance(exchange, consumable.address)).toEqual(102);
  });
});

describe('transferItem', () => {
  shouldTransferItem(createConsumableExchange, { superAdmin: CONSUMABLE_MINTER });
});
