/*
 * Copyright (c) 2020 The Paypr Company, LLC
 *
 * This file is NOT part of Paypr Ethereum Contracts and CANNOT be redistributed.
 */

import { expectRevert } from '@openzeppelin/test-helpers';
import { createRolesWithAllSameRole } from '../../helpers/AccessHelper';
import { CONSUMABLE_MINTER, getContractAddress, PLAYER1, PLAYER2, PLAYER3 } from '../../helpers/Accounts';
import {
  createConsumable,
  createPaypr,
  getAllowance,
  getBalance,
  increaseAllowance,
  mintConsumable,
  PayprContract,
} from '../../helpers/ConsumableHelper';
import { toNumberAsync } from '../../helpers/ContractHelper';
import {
  BASE_CONTRACT_ID,
  CONSUMABLE_EXCHANGE_ID,
  CONSUMABLE_ID,
  CONVERTIBLE_CONSUMABLE_ID,
  ERC165_ID,
  TRANSFERRING_ID,
} from '../../helpers/ContractIds';
import { shouldRestrictEnableAndDisable } from '../../helpers/DisableableHelper';
import { shouldSupportInterface } from '../../helpers/ERC165';
import { shouldTransferItem, shouldTransferToken } from '../../helpers/TransferringHelper';

describe('supportsInterface', () => {
  const create = async () => {
    const consumable = await createConsumable();
    return createPaypr(consumable.address);
  };

  shouldSupportInterface('ERC165', create, ERC165_ID);
  shouldSupportInterface('BaseContract', create, BASE_CONTRACT_ID);
  shouldSupportInterface('Consumable', create, CONSUMABLE_ID);
  shouldSupportInterface('ConsumableExchange', create, CONSUMABLE_EXCHANGE_ID);
  shouldSupportInterface('Paypr', create, CONVERTIBLE_CONSUMABLE_ID);
  shouldSupportInterface('Transfer', create, TRANSFERRING_ID);
});

describe('initializePaypr', () => {
  it('should set the BaseContract details', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));
    const consumable = await createConsumable();

    const paypr = await PayprContract.new();
    await paypr.initializePaypr(consumable.address, 1, 1, roleDelegate, { from: CONSUMABLE_MINTER });

    expect<string>(await paypr.contractName()).toEqual('Paypr');
    expect<string>(await paypr.contractDescription()).toEqual('Paypr exchange token');
    expect<string>(await paypr.contractUri()).toEqual('https://paypr.money/');
  });

  it('should set the ERC20 details', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));
    const consumable = await createConsumable();

    const paypr = await PayprContract.new();
    await paypr.initializePaypr(consumable.address, 1, 1, roleDelegate, { from: CONSUMABLE_MINTER });

    expect<string>(await paypr.contractName()).toEqual('Paypr');
    expect<string>(await paypr.symbol()).toEqual('ℙ');
    expect<number>(await toNumberAsync(paypr.decimals())).toEqual(18);
  });

  it('should set the base token and base exchange rates', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));
    const consumable = await createConsumable();

    const paypr = await PayprContract.new();
    await paypr.initializePaypr(consumable.address, 100, 200, roleDelegate, { from: CONSUMABLE_MINTER });

    expect<string>(await paypr.exchangeToken()).toEqual(consumable.address);
    expect<number>(await toNumberAsync(paypr.purchasePriceExchangeRate())).toEqual(100);
    expect<number>(await toNumberAsync(paypr.intrinsicValueExchangeRate())).toEqual(200);
  });

  it('should revert if the base exchange rate == 0', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));
    const consumable = await createConsumable();

    const paypr = await PayprContract.new();

    await expectRevert(
      paypr.initializePaypr(consumable.address, 0, 1, roleDelegate, { from: CONSUMABLE_MINTER }),
      'purchase price exchange rate must be > 0',
    );

    await expectRevert(
      paypr.initializePaypr(consumable.address, 1, 0, roleDelegate, { from: CONSUMABLE_MINTER }),
      'intrinsic value exchange rate must be > 0',
    );
  });

  it('should revert if called twice', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const paypr = await PayprContract.new();
    await paypr.initializePaypr(consumable1.address, 1, 2, roleDelegate, { from: CONSUMABLE_MINTER });

    await expectRevert(
      paypr.initializePaypr(consumable2.address, 100, 200, roleDelegate, { from: CONSUMABLE_MINTER }),
      'Contract instance has already been initialized',
    );

    expect<string>(await paypr.exchangeToken()).toEqual(consumable1.address);
    expect<number>(await toNumberAsync(paypr.purchasePriceExchangeRate())).toEqual(1);
    expect<number>(await toNumberAsync(paypr.intrinsicValueExchangeRate())).toEqual(2);
  });
});

describe('mint', () => {
  it('should give coins to the player', async () => {
    const consumable = await createConsumable();

    const paypr = await createPaypr(consumable.address);

    await paypr.mint(PLAYER1, 100, { from: CONSUMABLE_MINTER });
    await paypr.mint(PLAYER2, 50, { from: CONSUMABLE_MINTER });

    const result1 = await getBalance(paypr, PLAYER1);
    expect<number>(result1).toEqual(100);

    const result2 = await getBalance(paypr, PLAYER2);
    expect<number>(result2).toEqual(50);

    const result3 = await getBalance(paypr, PLAYER3);
    expect<number>(result3).toEqual(0);
  });

  it('should increase total supply', async () => {
    const consumable = await createConsumable();

    const paypr = await createPaypr(consumable.address);

    await paypr.mint(PLAYER1, 100, { from: CONSUMABLE_MINTER });
    await paypr.mint(PLAYER2, 50, { from: CONSUMABLE_MINTER });

    const result1 = await toNumberAsync(paypr.totalSupply());
    expect<number>(result1).toEqual(150);
  });

  it('should not mint coins if not the minter', async () => {
    const consumable = await createConsumable();

    const paypr = await createPaypr(consumable.address);

    await expectRevert(paypr.mint(PLAYER1, 100, { from: PLAYER2 }), 'Caller does not have the Minter role');

    const result1 = await getBalance(paypr, PLAYER1);
    expect<number>(result1).toEqual(0);

    const result2 = await getBalance(paypr, PLAYER2);
    expect<number>(result2).toEqual(0);
  });
});

describe('mintByExchange', () => {
  it('should exchange proper amount when the exchange rate is 1', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1);

    await mintConsumable(consumable1, PLAYER1, 1000);
    await mintConsumable(consumable2, PLAYER1, 1000);

    await increaseAllowance(consumable1, PLAYER1, paypr.address, 100);

    await paypr.mintByExchange(100, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(900);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(100);

    await increaseAllowance(consumable1, PLAYER1, paypr.address, 50);

    await paypr.mintByExchange(50, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(850);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(150);
  });

  it('should exchange proper amount when the exchange rate is large', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1000);

    await mintConsumable(consumable1, PLAYER1, 1000);
    await mintConsumable(consumable2, PLAYER1, 1000);

    await increaseAllowance(consumable1, PLAYER1, paypr.address, 100);

    await paypr.mintByExchange(100_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(900);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(100_000);

    await increaseAllowance(consumable1, PLAYER1, paypr.address, 50);

    await paypr.mintByExchange(50_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(850);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(150_000);
  });

  it('should exchange proper amount when the exchange rates are asymmetrical', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 10, 100);

    await mintConsumable(consumable1, PLAYER1, 1000);
    await mintConsumable(consumable2, PLAYER1, 1000);

    await increaseAllowance(consumable1, PLAYER1, paypr.address, 100);

    await paypr.mintByExchange(1000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(900);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(1000);

    await increaseAllowance(consumable1, PLAYER1, paypr.address, 50);

    await paypr.mintByExchange(500, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(850);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(1500);
  });

  it('should revert if the sender does not allow the correct exchangeToken balance of the sender when the exchange rate is 1', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1);

    await mintConsumable(consumable1, PLAYER1, 1000);
    await mintConsumable(consumable2, PLAYER1, 1000);

    await expectRevert(paypr.mintByExchange(100, { from: PLAYER1 }), 'transfer amount exceeds allowance');

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(0);

    await increaseAllowance(consumable1, PLAYER1, paypr.address, 99);

    await expectRevert(paypr.mintByExchange(100, { from: PLAYER1 }), 'transfer amount exceeds allowance');

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, paypr.address)).toEqual(99);
    expect<number>(await getAllowance(consumable2, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(0);
  });

  it('should revert if the sender does not allow the correct exchangeToken balance of the sender when the exchange rate is large', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1000);

    await mintConsumable(consumable1, PLAYER1, 1000);
    await mintConsumable(consumable2, PLAYER1, 1000);

    await expectRevert(paypr.mintByExchange(100000, { from: PLAYER1 }), 'transfer amount exceeds allowance');

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getAllowance(consumable2, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(0);

    await increaseAllowance(consumable1, PLAYER1, paypr.address, 99);

    await expectRevert(paypr.mintByExchange(100000, { from: PLAYER1 }), 'transfer amount exceeds allowance');

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, PLAYER1, paypr.address)).toEqual(99);
    expect<number>(await getAllowance(consumable2, PLAYER1, paypr.address)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(0);
  });
});

describe('burnByExchange', () => {
  it('should exchange proper amount when the exchange rate is 1', async () => {
    const roleDelegate = await createRolesWithAllSameRole(CONSUMABLE_MINTER);
    await roleDelegate.addMinter(PLAYER1, { from: CONSUMABLE_MINTER });

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1, 1, roleDelegate.address);

    await mintConsumable(consumable1, paypr.address, 1000);
    await mintConsumable(consumable2, paypr.address, 1000);
    await mintConsumable(paypr, PLAYER1, 1000);

    await paypr.burnByExchange(100, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, paypr.address)).toEqual(1000);
    expect<number>(await getBalance(consumable2, paypr.address)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, paypr.address, PLAYER1)).toEqual(100);
    expect<number>(await getAllowance(consumable2, paypr.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(900);

    await consumable1.transferFrom(paypr.address, PLAYER1, 100, { from: PLAYER1 });

    await paypr.burnByExchange(50, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, paypr.address)).toEqual(900);
    expect<number>(await getBalance(consumable2, paypr.address)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, paypr.address, PLAYER1)).toEqual(50);
    expect<number>(await getAllowance(consumable2, paypr.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(850);
  });

  it('should exchange proper amount when the exchange rate is large', async () => {
    const roleDelegate = await createRolesWithAllSameRole(CONSUMABLE_MINTER);
    await roleDelegate.addMinter(PLAYER1, { from: CONSUMABLE_MINTER });

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1000, 1000, roleDelegate.address);

    await mintConsumable(consumable1, paypr.address, 1000);
    await mintConsumable(consumable2, paypr.address, 1000);
    await mintConsumable(paypr, PLAYER1, 1_000_000);

    await paypr.burnByExchange(100_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, paypr.address)).toEqual(1000);
    expect<number>(await getBalance(consumable2, paypr.address)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, paypr.address, PLAYER1)).toEqual(100);
    expect<number>(await getAllowance(consumable2, paypr.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(900_000);

    await consumable1.transferFrom(paypr.address, PLAYER1, 100, { from: PLAYER1 });

    await paypr.burnByExchange(50_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, paypr.address)).toEqual(900);
    expect<number>(await getBalance(consumable2, paypr.address)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, paypr.address, PLAYER1)).toEqual(50);
    expect<number>(await getAllowance(consumable2, paypr.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(850_000);
  });

  it('should exchange proper amount when the exchange rates are asymmetrical', async () => {
    const roleDelegate = await createRolesWithAllSameRole(CONSUMABLE_MINTER);
    await roleDelegate.addMinter(PLAYER1, { from: CONSUMABLE_MINTER });

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 10, 100, roleDelegate.address);

    await mintConsumable(consumable1, paypr.address, 1000);
    await mintConsumable(consumable2, paypr.address, 1000);
    await mintConsumable(paypr, PLAYER1, 100_000);

    await paypr.burnByExchange(10_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, paypr.address)).toEqual(1000);
    expect<number>(await getBalance(consumable2, paypr.address)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, paypr.address, PLAYER1)).toEqual(100);
    expect<number>(await getAllowance(consumable2, paypr.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(90_000);

    await consumable1.transferFrom(paypr.address, PLAYER1, 100, { from: PLAYER1 });

    await paypr.burnByExchange(5_000, { from: PLAYER1 });

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, paypr.address)).toEqual(900);
    expect<number>(await getBalance(consumable2, paypr.address)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, paypr.address, PLAYER1)).toEqual(50);
    expect<number>(await getAllowance(consumable2, paypr.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(85_000);
  });

  it('should revert if sender is not minter', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1);

    await mintConsumable(consumable1, paypr.address, 1000);
    await mintConsumable(consumable2, paypr.address, 1000);
    await mintConsumable(paypr, PLAYER1, 1000);

    await expectRevert(paypr.burnByExchange(200, { from: PLAYER1 }), 'Caller does not have the Minter role');

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, paypr.address)).toEqual(1000);
    expect<number>(await getBalance(consumable2, paypr.address)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, paypr.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable2, paypr.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(1000);
  });

  it('should revert if the sender does not have enough token to burn when the exchange rate is 1', async () => {
    // TODO: remove when ready to exchange
    const roleDelegate = await createRolesWithAllSameRole(CONSUMABLE_MINTER);
    await roleDelegate.addMinter(PLAYER1, { from: CONSUMABLE_MINTER });

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1, 1, roleDelegate.address);

    await mintConsumable(consumable1, paypr.address, 1000);
    await mintConsumable(consumable2, paypr.address, 1000);

    await expectRevert(paypr.burnByExchange(100, { from: PLAYER1 }), 'burn amount exceeds balance');

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, paypr.address)).toEqual(1000);
    expect<number>(await getBalance(consumable2, paypr.address)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, paypr.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable2, paypr.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(0);

    await mintConsumable(paypr, PLAYER1, 99);

    await expectRevert(paypr.burnByExchange(100, { from: PLAYER1 }), 'burn amount exceeds balance');

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, paypr.address)).toEqual(1000);
    expect<number>(await getBalance(consumable2, paypr.address)).toEqual(1000);
    expect<number>(await getAllowance(consumable1, paypr.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable2, paypr.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(99);
  });

  it('should revert if the sender does not have enough token to burn when the exchange rate is large', async () => {
    // TODO: remove when ready to exchange
    const roleDelegate = await createRolesWithAllSameRole(CONSUMABLE_MINTER);
    await roleDelegate.addMinter(PLAYER1, { from: CONSUMABLE_MINTER });

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1000, 1000, roleDelegate.address);

    await mintConsumable(consumable1, paypr.address, 1_000_000);
    await mintConsumable(consumable2, paypr.address, 1_000_000);

    await expectRevert(paypr.burnByExchange(100_000, { from: PLAYER1 }), 'burn amount exceeds balance');

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, paypr.address)).toEqual(1_000_000);
    expect<number>(await getBalance(consumable2, paypr.address)).toEqual(1_000_000);
    expect<number>(await getAllowance(consumable1, paypr.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable2, paypr.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(0);

    await mintConsumable(paypr, PLAYER1, 99_999);

    await expectRevert(paypr.burnByExchange(100_000, { from: PLAYER1 }), 'burn amount exceeds balance');

    expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable1, paypr.address)).toEqual(1_000_000);
    expect<number>(await getBalance(consumable2, paypr.address)).toEqual(1_000_000);
    expect<number>(await getAllowance(consumable1, paypr.address, PLAYER1)).toEqual(0);
    expect<number>(await getAllowance(consumable2, paypr.address, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(paypr, PLAYER1)).toEqual(99_999);
  });
});

describe('Enable/Disable', () => {
  const create = async () => {
    const consumable = await createConsumable();
    return createPaypr(consumable.address);
  };

  shouldRestrictEnableAndDisable(create, CONSUMABLE_MINTER);
});

describe('transferToken', () => {
  const create = async () => {
    const consumable = await createConsumable();
    return createPaypr(consumable.address);
  };

  shouldTransferToken(create, { superAdmin: CONSUMABLE_MINTER });
});

describe('transferItem', () => {
  const create = async () => {
    const consumable = await createConsumable();
    return createPaypr(consumable.address);
  };

  shouldTransferItem(create, { superAdmin: CONSUMABLE_MINTER });
});
