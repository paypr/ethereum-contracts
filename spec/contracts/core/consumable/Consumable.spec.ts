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
import { CONSUMABLE_MINTER, PLAYER1, PLAYER2, PLAYER3 } from '../../../helpers/Accounts';
import { createConsumable, mintConsumable } from '../../../helpers/ConsumableHelper';
import { BASE_CONTRACT_ID, CONSUMABLE_ID, ERC165_ID, TRANSFERRING_ID } from '../../../helpers/ContractIds';
import { disableContract } from '../../../helpers/DisableableHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createConsumable, ERC165_ID);
  shouldSupportInterface('BaseContract', createConsumable, BASE_CONTRACT_ID);
  shouldSupportInterface('Consumable', createConsumable, CONSUMABLE_ID);
  shouldSupportInterface('Transfer', createConsumable, TRANSFERRING_ID);
});

describe('myBalance', () => {
  it('should return 0 when no accounts with a balance', async () => {
    const consumable = await createConsumable();

    const balance = await consumable.connect(PLAYER1).myBalance();
    expect<BigNumber>(balance).toEqBN(0);
  });

  it('should return 0 for an account with no balance', async () => {
    const consumable = await createConsumable();

    await mintConsumable(consumable, PLAYER2.address, 1000);

    expect<BigNumber>(await consumable.connect(PLAYER1).myBalance()).toEqBN(0);
  });

  it('should return 0 for an account with only an allowance', async () => {
    const consumable = await createConsumable();

    await mintConsumable(consumable, PLAYER2.address, 1000);
    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 500);

    expect<BigNumber>(await consumable.connect(PLAYER1).myBalance()).toEqBN(0);
  });

  it('should return the correct balance for an account with a balance', async () => {
    const consumable = await createConsumable();

    await mintConsumable(consumable, PLAYER1.address, 1000);
    await mintConsumable(consumable, PLAYER2.address, 2000);
    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 500);

    expect<BigNumber>(await consumable.connect(PLAYER1).myBalance()).toEqBN(1000);
  });
});

describe('myAllowance', () => {
  it('should return 0 when no accounts with an allowance', async () => {
    const consumable = await createConsumable();

    expect<BigNumber>(await consumable.connect(PLAYER1).myAllowance(PLAYER2.address)).toEqBN(0);
  });

  it('should return 0 for an account with no allowance', async () => {
    const consumable = await createConsumable();

    await consumable.connect(CONSUMABLE_MINTER).mint(PLAYER2.address, 1000);
    await consumable.connect(PLAYER2).increaseAllowance(PLAYER3.address, 500);

    expect<BigNumber>(await consumable.connect(PLAYER1).myAllowance(PLAYER2.address)).toEqBN(0);
  });

  it('should return 0 for an account with no allowance from the player', async () => {
    const consumable = await createConsumable();

    await mintConsumable(consumable, PLAYER2.address, 1000);
    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 500);

    expect<BigNumber>(await consumable.connect(PLAYER1).myAllowance(PLAYER3.address)).toEqBN(0);
  });

  it('should return 0 for an account with only a balance', async () => {
    const consumable = await createConsumable();

    await mintConsumable(consumable, PLAYER1.address, 1000);
    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 500);

    const balance = await consumable.connect(PLAYER1).myAllowance(PLAYER2.address);
    expect<BigNumber>(balance).toEqBN(0);
  });

  it('should return the correct balance for an account with an allowance', async () => {
    const consumable = await createConsumable();

    await mintConsumable(consumable, PLAYER1.address, 1000);
    await mintConsumable(consumable, PLAYER2.address, 2000);
    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 500);
    await consumable.connect(PLAYER2).increaseAllowance(PLAYER3.address, 1000);

    const balance = await consumable.connect(PLAYER1).myAllowance(PLAYER2.address);
    expect<BigNumber>(balance).toEqBN(500);
  });
});

describe('decimals', () => {
  it('should return 18', async () => {
    const consumable = await createConsumable();

    expect<number>(await consumable.decimals()).toEqual(18);
  });
});

describe('transfer', () => {
  it('should transfer when there are enough tokens', async () => {
    const consumable = await createConsumable();

    await mintConsumable(consumable, PLAYER1.address, 1000);

    await consumable.connect(PLAYER1).transfer(PLAYER2.address, 100);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(100);
  });

  it('should not transfer if not enough consumables', async () => {
    const consumable = await createConsumable();

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).transfer(PLAYER2.address, 100),
    ).toBeRevertedWith('transfer amount exceeds balance');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);

    await mintConsumable(consumable, PLAYER1.address, 99);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).transfer(PLAYER2.address, 100),
    ).toBeRevertedWith('transfer amount exceeds balance');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(99);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
  });

  it('should not transfer if disabled', async () => {
    const consumable = await createConsumable();

    await disableContract(consumable, CONSUMABLE_MINTER);

    await mintConsumable(consumable, PLAYER1.address, 1000);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).transfer(PLAYER2.address, 100),
    ).toBeRevertedWith('Contract is disabled');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
  });
});
