/*
 * Copyright (c) 2021 The Paypr Company, LLC
 *
 * This file is NOT part of Paypr Ethereum Contracts and CANNOT be redistributed.
 */

import { BigNumber, ContractTransaction } from 'ethers';
import { createRolesWithAllSameRole } from '../../helpers/AccessHelper';
import { CONSUMABLE_MINTER, PLAYER1, PLAYER2, PLAYER3 } from '../../helpers/Accounts';
import { createConsumable, createPaypr, deployPayprContract, mintConsumable } from '../../helpers/ConsumableHelper';
import { getContractAddress } from '../../helpers/ContractHelper';
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

    const paypr = await deployPayprContract();
    await paypr.connect(CONSUMABLE_MINTER).initializePaypr(consumable.address, 1, 1, roleDelegate);

    expect<string>(await paypr.contractName()).toEqual('Paypr');
    expect<string>(await paypr.contractDescription()).toEqual('Paypr exchange token');
    expect<string>(await paypr.contractUri()).toEqual('https://paypr.money/');
  });

  it('should set the ERC20 details', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));
    const consumable = await createConsumable();

    const paypr = await deployPayprContract();
    await paypr.connect(CONSUMABLE_MINTER).initializePaypr(consumable.address, 1, 1, roleDelegate);

    expect<string>(await paypr.contractName()).toEqual('Paypr');
    expect<string>(await paypr.symbol()).toEqual('ℙ');
    expect<number>(await paypr.decimals()).toEqual(18);
  });

  it('should set the base token and base exchange rates', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));
    const consumable = await createConsumable();

    const paypr = await deployPayprContract();
    await paypr.connect(CONSUMABLE_MINTER).initializePaypr(consumable.address, 100, 200, roleDelegate);

    expect<string>(await paypr.exchangeToken()).toEqual(consumable.address);
    expect<BigNumber>(await paypr.purchasePriceExchangeRate()).toEqBN(100);
    expect<BigNumber>(await paypr.intrinsicValueExchangeRate()).toEqBN(200);
  });

  it('should revert if the base exchange rate == 0', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));
    const consumable = await createConsumable();

    const paypr = await deployPayprContract();

    await expect<Promise<ContractTransaction>>(
      paypr.connect(CONSUMABLE_MINTER).initializePaypr(consumable.address, 0, 1, roleDelegate),
    ).toBeRevertedWith('purchase price exchange rate must be > 0');

    await expect<Promise<ContractTransaction>>(
      paypr.connect(CONSUMABLE_MINTER).initializePaypr(consumable.address, 1, 0, roleDelegate),
    ).toBeRevertedWith('intrinsic value exchange rate must be > 0');
  });

  it('should revert if called twice', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const paypr = await deployPayprContract();
    await paypr.connect(CONSUMABLE_MINTER).initializePaypr(consumable1.address, 1, 2, roleDelegate);

    await expect<Promise<ContractTransaction>>(
      paypr.connect(CONSUMABLE_MINTER).initializePaypr(consumable2.address, 100, 200, roleDelegate),
    ).toBeRevertedWith('contract is already initialized');

    expect<string>(await paypr.exchangeToken()).toEqual(consumable1.address);
    expect<BigNumber>(await paypr.purchasePriceExchangeRate()).toEqBN(1);
    expect<BigNumber>(await paypr.intrinsicValueExchangeRate()).toEqBN(2);
  });
});

describe('mint', () => {
  it('should give coins to the player', async () => {
    const consumable = await createConsumable();

    const paypr = await createPaypr(consumable.address);

    await paypr.connect(CONSUMABLE_MINTER).mint(PLAYER1.address, 100);
    await paypr.connect(CONSUMABLE_MINTER).mint(PLAYER2.address, 50);

    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await paypr.balanceOf(PLAYER2.address)).toEqBN(50);
    expect<BigNumber>(await paypr.balanceOf(PLAYER3.address)).toEqBN(0);
  });

  it('should increase total supply', async () => {
    const consumable = await createConsumable();

    const paypr = await createPaypr(consumable.address);

    await paypr.connect(CONSUMABLE_MINTER).mint(PLAYER1.address, 100);
    await paypr.connect(CONSUMABLE_MINTER).mint(PLAYER2.address, 50);

    expect<BigNumber>(await paypr.totalSupply()).toEqBN(150);
  });

  it('should not mint coins if not the minter', async () => {
    const consumable = await createConsumable();

    const paypr = await createPaypr(consumable.address);

    await expect<Promise<ContractTransaction>>(paypr.connect(PLAYER2).mint(PLAYER1.address, 100)).toBeRevertedWith(
      'Caller does not have the Minter role',
    );

    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER2.address)).toEqBN(0);
  });
});

describe('mintByExchange', () => {
  it('should exchange proper amount when the exchange rate is 1', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1);

    await mintConsumable(consumable1, PLAYER1.address, 1000);
    await mintConsumable(consumable2, PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(paypr.address, 100);

    await paypr.connect(PLAYER1).mintByExchange(100);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(100);

    await consumable1.connect(PLAYER1).increaseAllowance(paypr.address, 50);

    await paypr.connect(PLAYER1).mintByExchange(50);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(850);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(150);
  });

  it('should exchange proper amount when the exchange rate is large', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1000);

    await mintConsumable(consumable1, PLAYER1.address, 1000);
    await mintConsumable(consumable2, PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(paypr.address, 100);

    await paypr.connect(PLAYER1).mintByExchange(100_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(100_000);

    await consumable1.connect(PLAYER1).increaseAllowance(paypr.address, 50);

    await paypr.connect(PLAYER1).mintByExchange(50_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(850);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(150_000);
  });

  it('should exchange proper amount when the exchange rates are asymmetrical', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 10, 100);

    await mintConsumable(consumable1, PLAYER1.address, 1000);
    await mintConsumable(consumable2, PLAYER1.address, 1000);

    await consumable1.connect(PLAYER1).increaseAllowance(paypr.address, 100);

    await paypr.connect(PLAYER1).mintByExchange(1000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(1000);

    await consumable1.connect(PLAYER1).increaseAllowance(paypr.address, 50);

    await paypr.connect(PLAYER1).mintByExchange(500);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(850);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(1500);
  });

  it('should revert if the sender does not allow the correct exchangeToken balance of the sender when the exchange rate is 1', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1);

    await mintConsumable(consumable1, PLAYER1.address, 1000);
    await mintConsumable(consumable2, PLAYER1.address, 1000);

    await expect<Promise<ContractTransaction>>(paypr.connect(PLAYER1).mintByExchange(100)).toBeRevertedWith(
      'transfer amount exceeds allowance',
    );

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(0);

    await consumable1.connect(PLAYER1).increaseAllowance(paypr.address, 99);

    await expect<Promise<ContractTransaction>>(paypr.connect(PLAYER1).mintByExchange(100)).toBeRevertedWith(
      'transfer amount exceeds allowance',
    );

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, paypr.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(0);
  });

  it('should revert if the sender does not allow the correct exchangeToken balance of the sender when the exchange rate is large', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1000);

    await mintConsumable(consumable1, PLAYER1.address, 1000);
    await mintConsumable(consumable2, PLAYER1.address, 1000);

    await expect<Promise<ContractTransaction>>(paypr.connect(PLAYER1).mintByExchange(100000)).toBeRevertedWith(
      'transfer amount exceeds allowance',
    );

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(0);

    await consumable1.connect(PLAYER1).increaseAllowance(paypr.address, 99);

    await expect<Promise<ContractTransaction>>(paypr.connect(PLAYER1).mintByExchange(100000)).toBeRevertedWith(
      'transfer amount exceeds allowance',
    );

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(PLAYER1.address, paypr.address)).toEqBN(99);
    expect<BigNumber>(await consumable2.allowance(PLAYER1.address, paypr.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(0);
  });
});

describe('burnByExchange', () => {
  it('should exchange proper amount when the exchange rate is 1', async () => {
    const roleDelegate = await createRolesWithAllSameRole(CONSUMABLE_MINTER);
    await roleDelegate.connect(CONSUMABLE_MINTER).addMinter(PLAYER1.address);

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1, 1, roleDelegate.address);

    await mintConsumable(consumable1, paypr.address, 1000);
    await mintConsumable(consumable2, paypr.address, 1000);
    await mintConsumable(paypr, PLAYER1.address, 1000);

    await paypr.connect(PLAYER1).burnByExchange(100);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(paypr.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(paypr.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(paypr.address, PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(paypr.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(900);

    await consumable1.connect(PLAYER1).transferFrom(paypr.address, PLAYER1.address, 100);

    await paypr.connect(PLAYER1).burnByExchange(50);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(paypr.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(paypr.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(paypr.address, PLAYER1.address)).toEqBN(50);
    expect<BigNumber>(await consumable2.allowance(paypr.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(850);
  });

  it('should exchange proper amount when the exchange rate is large', async () => {
    const roleDelegate = await createRolesWithAllSameRole(CONSUMABLE_MINTER);
    await roleDelegate.connect(CONSUMABLE_MINTER).addMinter(PLAYER1.address);

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1000, 1000, roleDelegate.address);

    await mintConsumable(consumable1, paypr.address, 1000);
    await mintConsumable(consumable2, paypr.address, 1000);
    await mintConsumable(paypr, PLAYER1.address, 1_000_000);

    await paypr.connect(PLAYER1).burnByExchange(100_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(paypr.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(paypr.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(paypr.address, PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(paypr.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(900_000);

    await consumable1.connect(PLAYER1).transferFrom(paypr.address, PLAYER1.address, 100);

    await paypr.connect(PLAYER1).burnByExchange(50_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(paypr.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(paypr.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(paypr.address, PLAYER1.address)).toEqBN(50);
    expect<BigNumber>(await consumable2.allowance(paypr.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(850_000);
  });

  it('should exchange proper amount when the exchange rates are asymmetrical', async () => {
    const roleDelegate = await createRolesWithAllSameRole(CONSUMABLE_MINTER);
    await roleDelegate.connect(CONSUMABLE_MINTER).addMinter(PLAYER1.address);

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 10, 100, roleDelegate.address);

    await mintConsumable(consumable1, paypr.address, 1000);
    await mintConsumable(consumable2, paypr.address, 1000);
    await mintConsumable(paypr, PLAYER1.address, 100_000);

    await paypr.connect(PLAYER1).burnByExchange(10_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(paypr.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(paypr.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(paypr.address, PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(paypr.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(90_000);

    await consumable1.connect(PLAYER1).transferFrom(paypr.address, PLAYER1.address, 100);

    await paypr.connect(PLAYER1).burnByExchange(5_000);

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(paypr.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(paypr.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(paypr.address, PLAYER1.address)).toEqBN(50);
    expect<BigNumber>(await consumable2.allowance(paypr.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(85_000);
  });

  it('should revert if sender is not minter', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1);

    await mintConsumable(consumable1, paypr.address, 1000);
    await mintConsumable(consumable2, paypr.address, 1000);
    await mintConsumable(paypr, PLAYER1.address, 1000);

    await expect<Promise<ContractTransaction>>(paypr.connect(PLAYER1).burnByExchange(200)).toBeRevertedWith(
      'Caller does not have the Minter role',
    );

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(paypr.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(paypr.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(paypr.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(paypr.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(1000);
  });

  it('should revert if the sender does not have enough token to burn when the exchange rate is 1', async () => {
    // TODO: remove when ready to exchange
    const roleDelegate = await createRolesWithAllSameRole(CONSUMABLE_MINTER);
    await roleDelegate.connect(CONSUMABLE_MINTER).addMinter(PLAYER1.address);

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1, 1, roleDelegate.address);

    await mintConsumable(consumable1, paypr.address, 1000);
    await mintConsumable(consumable2, paypr.address, 1000);

    await expect<Promise<ContractTransaction>>(paypr.connect(PLAYER1).burnByExchange(100)).toBeRevertedWith(
      'burn amount exceeds balance',
    );

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(paypr.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(paypr.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(paypr.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(paypr.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(0);

    await mintConsumable(paypr, PLAYER1.address, 99);

    await expect<Promise<ContractTransaction>>(paypr.connect(PLAYER1).burnByExchange(100)).toBeRevertedWith(
      'burn amount exceeds balance',
    );

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(paypr.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(paypr.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.allowance(paypr.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(paypr.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(99);
  });

  it('should revert if the sender does not have enough token to burn when the exchange rate is large', async () => {
    // TODO: remove when ready to exchange
    const roleDelegate = await createRolesWithAllSameRole(CONSUMABLE_MINTER);
    await roleDelegate.connect(CONSUMABLE_MINTER).addMinter(PLAYER1.address);

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const paypr = await createPaypr(consumable1.address, 1000, 1000, roleDelegate.address);

    await mintConsumable(consumable1, paypr.address, 1_000_000);
    await mintConsumable(consumable2, paypr.address, 1_000_000);

    await expect<Promise<ContractTransaction>>(paypr.connect(PLAYER1).burnByExchange(100_000)).toBeRevertedWith(
      'burn amount exceeds balance',
    );

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(paypr.address)).toEqBN(1_000_000);
    expect<BigNumber>(await consumable2.balanceOf(paypr.address)).toEqBN(1_000_000);
    expect<BigNumber>(await consumable1.allowance(paypr.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(paypr.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(0);

    await mintConsumable(paypr, PLAYER1.address, 99_999);

    await expect<Promise<ContractTransaction>>(paypr.connect(PLAYER1).burnByExchange(100_000)).toBeRevertedWith(
      'burn amount exceeds balance',
    );

    expect<BigNumber>(await consumable1.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.balanceOf(paypr.address)).toEqBN(1_000_000);
    expect<BigNumber>(await consumable2.balanceOf(paypr.address)).toEqBN(1_000_000);
    expect<BigNumber>(await consumable1.allowance(paypr.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(paypr.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await paypr.balanceOf(PLAYER1.address)).toEqBN(99_999);
  });
});

describe('Enable/Disable', () => {
  const create = async () => {
    const consumable = await createConsumable();
    return createPaypr(consumable.address);
  };

  shouldRestrictEnableAndDisable(create, { getAdmin: () => CONSUMABLE_MINTER });
});

describe('transferToken', () => {
  const create = async () => {
    const consumable = await createConsumable();
    return createPaypr(consumable.address);
  };

  shouldTransferToken(create, { getSuperAdmin: () => CONSUMABLE_MINTER });
});

describe('transferItem', () => {
  const create = async () => {
    const consumable = await createConsumable();
    return createPaypr(consumable.address);
  };

  shouldTransferItem(create, { getSuperAdmin: () => CONSUMABLE_MINTER });
});
