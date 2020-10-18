/*
 * Copyright (c) 2020 The Paypr Company
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
import { CONSUMABLE_MINTER, getContractAddress, PLAYER1, PLAYER2, PLAYER3 } from '../../../helpers/Accounts';
import { ConsumableContract, createConsumable, getBalance } from '../../../helpers/ConsumableHelper';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import { shouldRestrictEnableAndDisable } from '../../../helpers/DisableableHelper';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('initializeConsumable', () => {
  it('should set the name', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await ConsumableContract.new();
    await consumable.initializeConsumable(withDefaultContractInfo({ name: 'the name' }), '', roleDelegate, {
      from: CONSUMABLE_MINTER,
    });

    expect<string>(await consumable.name()).toEqual('the name');
    expect<string>(await consumable.contractName()).toEqual('the name');
  });

  it('should set the description', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await ConsumableContract.new();
    await consumable.initializeConsumable(
      withDefaultContractInfo({ description: 'the description' }),
      '',
      roleDelegate,
      {
        from: CONSUMABLE_MINTER,
      },
    );

    expect<string>(await consumable.contractDescription()).toEqual('the description');
  });

  it('should set the uri', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await ConsumableContract.new();
    await consumable.initializeConsumable(withDefaultContractInfo({ uri: 'the uri' }), '', roleDelegate, {
      from: CONSUMABLE_MINTER,
    });

    expect<string>(await consumable.contractUri()).toEqual('the uri');
  });

  it('should set the symbol', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await ConsumableContract.new();
    await consumable.initializeConsumable(withDefaultContractInfo({}), 'the symbol', roleDelegate, {
      from: CONSUMABLE_MINTER,
    });

    expect<string>(await consumable.symbol()).toEqual('the symbol');
  });

  it('should revert if called twice', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await ConsumableContract.new();
    await consumable.initializeConsumable(withDefaultContractInfo({ name: 'the name' }), '', roleDelegate, {
      from: CONSUMABLE_MINTER,
    });

    await expectRevert(
      consumable.initializeConsumable(withDefaultContractInfo({ name: 'the new name' }), '', roleDelegate, {
        from: CONSUMABLE_MINTER,
      }),
      'Contract instance has already been initialized',
    );

    expect<string>(await consumable.name()).toEqual('the name');
  });
});

describe('mint', () => {
  it('should give coins to the player', async () => {
    const consumable = await createConsumable({});

    await consumable.mint(PLAYER1, 100, { from: CONSUMABLE_MINTER });
    await consumable.mint(PLAYER2, 50, { from: CONSUMABLE_MINTER });

    const result1 = await getBalance(consumable, PLAYER1);
    expect<number>(result1).toEqual(100);

    const result2 = await getBalance(consumable, PLAYER2);
    expect<number>(result2).toEqual(50);

    const result3 = await getBalance(consumable, PLAYER3);
    expect<number>(result3).toEqual(0);
  });

  it('should increase total supply', async () => {
    const consumable = await createConsumable({});

    await consumable.mint(PLAYER1, 100, { from: CONSUMABLE_MINTER });
    await consumable.mint(PLAYER2, 50, { from: CONSUMABLE_MINTER });

    const result1 = await toNumberAsync(consumable.totalSupply());
    expect<number>(result1).toEqual(150);
  });

  it('should not mint coins if not the minter', async () => {
    const consumable = await createConsumable({});

    await expectRevert(consumable.mint(PLAYER1, 100, { from: PLAYER2 }), 'Caller does not have the Minter role');

    const result1 = await getBalance(consumable, PLAYER1);
    expect<number>(result1).toEqual(0);

    const result2 = await getBalance(consumable, PLAYER2);
    expect<number>(result2).toEqual(0);
  });
});

describe('Enable/Disable', () => {
  shouldRestrictEnableAndDisable(createConsumable, CONSUMABLE_MINTER);
});

describe('transferToken', () => {
  shouldTransferToken(createConsumable, { superAdmin: CONSUMABLE_MINTER });
});

describe('transferItem', () => {
  shouldTransferItem(createConsumable, { superAdmin: CONSUMABLE_MINTER });
});
