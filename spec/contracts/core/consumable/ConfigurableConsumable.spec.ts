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
import { createConsumable, deployConsumableContract } from '../../../helpers/ConsumableHelper';
import { getContractAddress } from '../../../helpers/ContractHelper';
import { shouldRestrictEnableAndDisable } from '../../../helpers/DisableableHelper';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('initializeConsumable', () => {
  it('should set the name', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await deployConsumableContract();
    await consumable
      .connect(CONSUMABLE_MINTER)
      .initializeConsumable(withDefaultContractInfo({ name: 'the name' }), '', roleDelegate);

    expect<string>(await consumable.name()).toEqual('the name');
    expect<string>(await consumable.contractName()).toEqual('the name');
  });

  it('should set the description', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await deployConsumableContract();
    await consumable
      .connect(CONSUMABLE_MINTER)
      .initializeConsumable(withDefaultContractInfo({ description: 'the description' }), '', roleDelegate);

    expect<string>(await consumable.contractDescription()).toEqual('the description');
  });

  it('should set the uri', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await deployConsumableContract();
    await consumable
      .connect(CONSUMABLE_MINTER)
      .initializeConsumable(withDefaultContractInfo({ uri: 'the uri' }), '', roleDelegate);

    expect<string>(await consumable.contractUri()).toEqual('the uri');
  });

  it('should set the symbol', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await deployConsumableContract();
    await consumable
      .connect(CONSUMABLE_MINTER)
      .initializeConsumable(withDefaultContractInfo({}), 'the symbol', roleDelegate);

    expect<string>(await consumable.symbol()).toEqual('the symbol');
  });

  it('should revert if called twice', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await deployConsumableContract();
    await consumable
      .connect(CONSUMABLE_MINTER)
      .initializeConsumable(withDefaultContractInfo({ name: 'the name' }), '', roleDelegate);

    await expect<Promise<ContractTransaction>>(
      consumable
        .connect(CONSUMABLE_MINTER)
        .initializeConsumable(withDefaultContractInfo({ name: 'the new name' }), '', roleDelegate),
    ).toBeRevertedWith('contract is already initialized');

    expect<string>(await consumable.name()).toEqual('the name');
  });
});

describe('mint', () => {
  it('should give coins to the player', async () => {
    const consumable = await createConsumable({});

    await consumable.connect(CONSUMABLE_MINTER).mint(PLAYER1.address, 100);
    await consumable.connect(CONSUMABLE_MINTER).mint(PLAYER2.address, 50);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(50);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(0);
  });

  it('should increase total supply', async () => {
    const consumable = await createConsumable({});

    await consumable.connect(CONSUMABLE_MINTER).mint(PLAYER1.address, 100);
    await consumable.connect(CONSUMABLE_MINTER).mint(PLAYER2.address, 50);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(150);
  });

  it('should not mint coins if not the minter', async () => {
    const consumable = await createConsumable({});

    await expect<Promise<ContractTransaction>>(consumable.connect(PLAYER2).mint(PLAYER1.address, 100)).toBeRevertedWith(
      'Caller does not have the Minter role',
    );

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
  });
});

describe('Enable/Disable', () => {
  shouldRestrictEnableAndDisable(createConsumable, { getAdmin: () => CONSUMABLE_MINTER });
});

describe('transferToken', () => {
  shouldTransferToken(createConsumable, { getSuperAdmin: () => CONSUMABLE_MINTER });
});

describe('transferItem', () => {
  shouldTransferItem(createConsumable, { getSuperAdmin: () => CONSUMABLE_MINTER });
});
