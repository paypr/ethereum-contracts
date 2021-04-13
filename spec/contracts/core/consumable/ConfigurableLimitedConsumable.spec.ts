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

import { BigNumber, ContractTransaction } from 'ethers';
import { withDefaultContractInfo } from '../../../../src/contracts/core/contractInfo';
import { createRolesWithAllSameRole } from '../../../helpers/AccessHelper';
import { CONSUMABLE_MINTER, PLAYER1, PLAYER2, PLAYER3 } from '../../../helpers/Accounts';
import {
  createLimitedConsumable,
  deployLimitedConsumableContract,
  increaseLimit,
  mintConsumable,
} from '../../../helpers/ConsumableHelper';
import { getContractAddress } from '../../../helpers/ContractHelper';
import { disableContract, shouldRestrictEnableAndDisable } from '../../../helpers/DisableableHelper';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('initializeLimitedConsumable', () => {
  it('should set the name', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await deployLimitedConsumableContract();
    await consumable
      .connect(CONSUMABLE_MINTER)
      .initializeLimitedConsumable(withDefaultContractInfo({ name: 'the name' }), '', roleDelegate);

    expect<string>(await consumable.contractName()).toEqual('the name');
  });

  it('should set the description', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await deployLimitedConsumableContract();
    await consumable
      .connect(CONSUMABLE_MINTER)
      .initializeLimitedConsumable(withDefaultContractInfo({ description: 'the description' }), '', roleDelegate);

    expect<string>(await consumable.contractDescription()).toEqual('the description');
  });

  it('should set the uri', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await deployLimitedConsumableContract();
    await consumable
      .connect(CONSUMABLE_MINTER)
      .initializeLimitedConsumable(withDefaultContractInfo({ uri: 'the uri' }), '', roleDelegate);

    expect<string>(await consumable.contractUri()).toEqual('the uri');
  });

  it('should set the symbol', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await deployLimitedConsumableContract();
    await consumable
      .connect(CONSUMABLE_MINTER)
      .initializeLimitedConsumable(withDefaultContractInfo({}), 'the symbol', roleDelegate);

    expect<string>(await consumable.symbol()).toEqual('the symbol');
  });

  it('should revert if called twice', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await deployLimitedConsumableContract();
    await consumable
      .connect(CONSUMABLE_MINTER)
      .initializeLimitedConsumable(withDefaultContractInfo({ name: 'the name' }), '', roleDelegate);

    await expect<Promise<ContractTransaction>>(
      consumable
        .connect(CONSUMABLE_MINTER)
        .initializeLimitedConsumable(withDefaultContractInfo({ name: 'the new name' }), '', roleDelegate),
    ).toBeRevertedWith('contract is already initialized');

    expect<string>(await consumable.contractName()).toEqual('the name');
  });
});

describe('mint', () => {
  it('should give coins to the player', async () => {
    const consumable = await createLimitedConsumable();

    await consumable.connect(CONSUMABLE_MINTER).mint(PLAYER1.address, 100);
    await consumable.connect(CONSUMABLE_MINTER).mint(PLAYER2.address, 50);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(50);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(0);
  });

  it('should give coins to the player when they have a limit', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1.address, 100);
    await increaseLimit(consumable, PLAYER2.address, 200);
    await increaseLimit(consumable, PLAYER3.address, 300);

    await consumable.connect(CONSUMABLE_MINTER).mint(PLAYER1.address, 100);
    await consumable.connect(CONSUMABLE_MINTER).mint(PLAYER2.address, 50);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(50);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(0);
  });

  it('should increase total supply', async () => {
    const consumable = await createLimitedConsumable();

    await consumable.connect(CONSUMABLE_MINTER).mint(PLAYER1.address, 100);
    await consumable.connect(CONSUMABLE_MINTER).mint(PLAYER2.address, 50);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(150);
  });

  it('should not mint coins if not the minter', async () => {
    const consumable = await createLimitedConsumable();

    await expect<Promise<ContractTransaction>>(consumable.connect(PLAYER2).mint(PLAYER1.address, 100)).toBeRevertedWith(
      'Caller does not have the Minter role',
    );

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
  });

  it('should not mint coins if the receiver will be over their limit', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1.address, 50);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(CONSUMABLE_MINTER).mint(PLAYER1.address, 51),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable.totalSupply()).toEqBN(0);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(CONSUMABLE_MINTER).mint(PLAYER1.address, 100),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable.totalSupply()).toEqBN(0);
  });
});

describe('increaseLimit', () => {
  it('should increase the limit of the account', async () => {
    const consumable = await createLimitedConsumable();

    await consumable.connect(CONSUMABLE_MINTER).increaseLimit(PLAYER1.address, 100);

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(100);

    await consumable.connect(CONSUMABLE_MINTER).increaseLimit(PLAYER2.address, 200);

    expect<BigNumber>(await consumable.limitOf(PLAYER2.address)).toEqBN(200);

    await consumable.connect(CONSUMABLE_MINTER).increaseLimit(PLAYER1.address, 50);

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(150);
    expect<BigNumber>(await consumable.limitOf(PLAYER2.address)).toEqBN(200);
  });

  it('should not change limit if would overflow', async () => {
    const consumable = await createLimitedConsumable();

    await consumable.connect(CONSUMABLE_MINTER).increaseLimit(PLAYER1.address, 100);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(CONSUMABLE_MINTER).increaseLimit(PLAYER1.address, -1),
    ).toBeRevertedWith('value out-of-bounds');

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(100);
  });

  it('should not change limit if not the minter', async () => {
    const consumable = await createLimitedConsumable();

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER2).increaseLimit(PLAYER1.address, 100),
    ).toBeRevertedWith('Caller does not have the Minter role');

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable.limitOf(PLAYER2.address)).toEqBN(0);
  });

  it('should not increase the limit if disabled', async () => {
    const consumable = await createLimitedConsumable();

    await disableContract(consumable, CONSUMABLE_MINTER);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(CONSUMABLE_MINTER).increaseLimit(PLAYER1.address, 100),
    ).toBeRevertedWith('Contract is disabled');
  });
});

describe('decreaseLimit', () => {
  it('should decrease the limit of the account', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1.address, 200);
    await increaseLimit(consumable, PLAYER2.address, 500);

    await consumable.connect(CONSUMABLE_MINTER).decreaseLimit(PLAYER1.address, 100);

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(100);

    await consumable.connect(CONSUMABLE_MINTER).decreaseLimit(PLAYER2.address, 200);

    expect<BigNumber>(await consumable.limitOf(PLAYER2.address)).toEqBN(300);

    await consumable.connect(CONSUMABLE_MINTER).decreaseLimit(PLAYER1.address, 50);

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(50);
    expect<BigNumber>(await consumable.limitOf(PLAYER2.address)).toEqBN(300);
  });

  it('should not change limit if would go below 0', async () => {
    const consumable = await createLimitedConsumable();

    await expect<Promise<ContractTransaction>>(
      consumable.connect(CONSUMABLE_MINTER).decreaseLimit(PLAYER1.address, 1),
    ).toBeRevertedWith('decreased limit below zero');

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(0);

    await increaseLimit(consumable, PLAYER1.address, 100);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(CONSUMABLE_MINTER).decreaseLimit(PLAYER1.address, 101),
    ).toBeRevertedWith('decreased limit below zero');

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(100);
  });

  it('should not change limit if not the minter', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1.address, 100);
    await increaseLimit(consumable, PLAYER2.address, 200);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER2).decreaseLimit(PLAYER1.address, 50),
    ).toBeRevertedWith('Caller does not have the Minter role');

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.limitOf(PLAYER2.address)).toEqBN(200);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER2).decreaseLimit(PLAYER1.address, 100),
    ).toBeRevertedWith('Caller does not have the Minter role');

    expect<BigNumber>(await consumable.limitOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.limitOf(PLAYER2.address)).toEqBN(200);
  });

  it('should not decrease the limit if disabled', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1.address, 200);

    await disableContract(consumable, CONSUMABLE_MINTER);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(CONSUMABLE_MINTER).decreaseLimit(PLAYER1.address, 100),
    ).toBeRevertedWith('Contract is disabled');
  });
});

describe('transfer', () => {
  it('should transfer if the receiver does not have a limit', async () => {
    const consumable = await createLimitedConsumable();

    await mintConsumable(consumable, PLAYER1.address, 100);
    await mintConsumable(consumable, PLAYER2.address, 500);

    await consumable.connect(PLAYER2).transfer(PLAYER1.address, 50);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(150);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(450);

    await consumable.connect(PLAYER2).transfer(PLAYER1.address, 50);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(200);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(400);

    await consumable.connect(PLAYER1).transfer(PLAYER2.address, 75);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(125);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(475);

    await consumable.connect(PLAYER1).transfer(PLAYER2.address, 25);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(500);
  });

  it('should transfer if the receiver will not be over the limit', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1.address, 200);
    await increaseLimit(consumable, PLAYER2.address, 500);

    await mintConsumable(consumable, PLAYER1.address, 100);
    await mintConsumable(consumable, PLAYER2.address, 500);

    await consumable.connect(PLAYER2).transfer(PLAYER1.address, 50);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(150);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(450);

    await consumable.connect(PLAYER2).transfer(PLAYER1.address, 50);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(200);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(400);

    await consumable.connect(PLAYER1).transfer(PLAYER2.address, 75);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(125);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(475);

    await consumable.connect(PLAYER1).transfer(PLAYER2.address, 25);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(500);
  });

  it('should not transfer if the receiver would go over the limit', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1.address, 200);
    await increaseLimit(consumable, PLAYER2.address, 500);

    await mintConsumable(consumable, PLAYER1.address, 100);
    await mintConsumable(consumable, PLAYER2.address, 450);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER2).transfer(PLAYER1.address, 101),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(450);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER2).transfer(PLAYER1.address, 150),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(450);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).transfer(PLAYER2.address, 51),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(450);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).transfer(PLAYER2.address, 100),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(450);
  });
});

describe('transferFrom', () => {
  it('should transfer if the receiver does not have a limit', async () => {
    const consumable = await createLimitedConsumable();

    await mintConsumable(consumable, PLAYER1.address, 100);
    await mintConsumable(consumable, PLAYER2.address, 500);

    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 50);
    await consumable.connect(PLAYER1).transferFrom(PLAYER2.address, PLAYER1.address, 50);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(150);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(450);

    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 50);
    await consumable.connect(PLAYER1).transferFrom(PLAYER2.address, PLAYER1.address, 50);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(200);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(400);

    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 75);
    await consumable.connect(PLAYER2).transferFrom(PLAYER1.address, PLAYER2.address, 75);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(125);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(475);

    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 25);
    await consumable.connect(PLAYER2).transferFrom(PLAYER1.address, PLAYER2.address, 25);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(500);
  });

  it('should transfer if the receiver will not be over the limit', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1.address, 200);
    await increaseLimit(consumable, PLAYER2.address, 500);

    await mintConsumable(consumable, PLAYER1.address, 100);
    await mintConsumable(consumable, PLAYER2.address, 500);

    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 50);
    await consumable.connect(PLAYER1).transferFrom(PLAYER2.address, PLAYER1.address, 50);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(150);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(450);

    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 50);
    await consumable.connect(PLAYER1).transferFrom(PLAYER2.address, PLAYER1.address, 50);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(200);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(400);

    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 75);
    await consumable.connect(PLAYER2).transferFrom(PLAYER1.address, PLAYER2.address, 75);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(125);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(475);

    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 25);
    await consumable.connect(PLAYER2).transferFrom(PLAYER1.address, PLAYER2.address, 25);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(500);
  });

  it('should not transfer if the receiver would go over the limit', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1.address, 200);
    await increaseLimit(consumable, PLAYER2.address, 500);

    await mintConsumable(consumable, PLAYER1.address, 100);
    await mintConsumable(consumable, PLAYER2.address, 450);

    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 101);
    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).transferFrom(PLAYER2.address, PLAYER1.address, 101),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(450);

    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 49);
    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).transferFrom(PLAYER2.address, PLAYER1.address, 150),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(450);

    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 51);
    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).transferFrom(PLAYER1.address, PLAYER2.address, 51),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(450);

    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 49);
    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).transferFrom(PLAYER1.address, PLAYER2.address, 100),
    ).toBeRevertedWith('account balance over the limit');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(450);
  });
});

describe('Enable/Disable', () => {
  shouldRestrictEnableAndDisable(createLimitedConsumable, { getAdmin: () => CONSUMABLE_MINTER });
});

describe('transferToken', () => {
  shouldTransferToken(createLimitedConsumable, { getSuperAdmin: () => CONSUMABLE_MINTER });
});

describe('transferItem', () => {
  shouldTransferItem(createLimitedConsumable, { getSuperAdmin: () => CONSUMABLE_MINTER });
});
