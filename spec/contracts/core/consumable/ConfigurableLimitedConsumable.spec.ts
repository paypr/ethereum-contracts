/*
 * Copyright (c) 2020 The Paypr Company, LLC
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
import {
  createLimitedConsumable,
  getBalance,
  getLimit,
  increaseAllowance,
  increaseLimit,
  LimitedConsumableContract,
  mintConsumable,
} from '../../../helpers/ConsumableHelper';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import { disableContract, shouldRestrictEnableAndDisable } from '../../../helpers/DisableableHelper';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('initializeLimitedConsumable', () => {
  it('should set the name', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await LimitedConsumableContract.new();
    await consumable.initializeLimitedConsumable(withDefaultContractInfo({ name: 'the name' }), '', roleDelegate, {
      from: CONSUMABLE_MINTER,
    });

    expect<string>(await consumable.contractName()).toEqual('the name');
  });

  it('should set the description', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await LimitedConsumableContract.new();
    await consumable.initializeLimitedConsumable(
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

    const consumable = await LimitedConsumableContract.new();
    await consumable.initializeLimitedConsumable(withDefaultContractInfo({ uri: 'the uri' }), '', roleDelegate, {
      from: CONSUMABLE_MINTER,
    });

    expect<string>(await consumable.contractUri()).toEqual('the uri');
  });

  it('should set the symbol', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await LimitedConsumableContract.new();
    await consumable.initializeLimitedConsumable(withDefaultContractInfo({}), 'the symbol', roleDelegate, {
      from: CONSUMABLE_MINTER,
    });

    expect<string>(await consumable.symbol()).toEqual('the symbol');
  });

  it('should revert if called twice', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(CONSUMABLE_MINTER));

    const consumable = await LimitedConsumableContract.new();
    await consumable.initializeLimitedConsumable(withDefaultContractInfo({ name: 'the name' }), '', roleDelegate, {
      from: CONSUMABLE_MINTER,
    });

    await expectRevert(
      consumable.initializeLimitedConsumable(withDefaultContractInfo({ name: 'the new name' }), '', roleDelegate, {
        from: CONSUMABLE_MINTER,
      }),
      'Contract instance has already been initialized',
    );

    expect<string>(await consumable.contractName()).toEqual('the name');
  });
});

describe('mint', () => {
  it('should give coins to the player', async () => {
    const consumable = await createLimitedConsumable();

    await consumable.mint(PLAYER1, 100, { from: CONSUMABLE_MINTER });
    await consumable.mint(PLAYER2, 50, { from: CONSUMABLE_MINTER });

    const result1 = await getBalance(consumable, PLAYER1);
    expect<number>(result1).toEqual(100);

    const result2 = await getBalance(consumable, PLAYER2);
    expect<number>(result2).toEqual(50);

    const result3 = await getBalance(consumable, PLAYER3);
    expect<number>(result3).toEqual(0);
  });

  it('should give coins to the player when they have a limit', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1, 100);
    await increaseLimit(consumable, PLAYER2, 200);
    await increaseLimit(consumable, PLAYER3, 300);

    await consumable.mint(PLAYER1, 100, { from: CONSUMABLE_MINTER });
    await consumable.mint(PLAYER2, 50, { from: CONSUMABLE_MINTER });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(50);
    expect<number>(await getBalance(consumable, PLAYER3)).toEqual(0);
  });

  it('should increase total supply', async () => {
    const consumable = await createLimitedConsumable();

    await consumable.mint(PLAYER1, 100, { from: CONSUMABLE_MINTER });
    await consumable.mint(PLAYER2, 50, { from: CONSUMABLE_MINTER });

    expect<number>(await toNumberAsync(consumable.totalSupply())).toEqual(150);
  });

  it('should not mint coins if not the minter', async () => {
    const consumable = await createLimitedConsumable();

    await expectRevert(consumable.mint(PLAYER1, 100, { from: PLAYER2 }), 'Caller does not have the Minter role');

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(0);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(0);
  });

  it('should not mint coins if the receiver will be over their limit', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1, 50);

    await expectRevert(consumable.mint(PLAYER1, 51, { from: CONSUMABLE_MINTER }), 'account balance over the limit');

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(0);
    expect<number>(await toNumberAsync(consumable.totalSupply())).toEqual(0);

    await expectRevert(consumable.mint(PLAYER1, 100, { from: CONSUMABLE_MINTER }), 'account balance over the limit');

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(0);
    expect<number>(await toNumberAsync(consumable.totalSupply())).toEqual(0);
  });
});

describe('increaseLimit', () => {
  it('should increase the limit of the account', async () => {
    const consumable = await createLimitedConsumable();

    await consumable.increaseLimit(PLAYER1, 100, { from: CONSUMABLE_MINTER });

    expect<number>(await getLimit(consumable, PLAYER1)).toEqual(100);

    await consumable.increaseLimit(PLAYER2, 200, { from: CONSUMABLE_MINTER });

    expect<number>(await getLimit(consumable, PLAYER2)).toEqual(200);

    await consumable.increaseLimit(PLAYER1, 50, { from: CONSUMABLE_MINTER });

    expect<number>(await getLimit(consumable, PLAYER1)).toEqual(150);
    expect<number>(await getLimit(consumable, PLAYER2)).toEqual(200);
  });

  it('should not change limit if would overflow', async () => {
    const consumable = await createLimitedConsumable();

    await consumable.increaseLimit(PLAYER1, 100, { from: CONSUMABLE_MINTER });

    await expectRevert(consumable.increaseLimit(PLAYER1, -1, { from: CONSUMABLE_MINTER }), 'addition overflow');

    expect<number>(await getLimit(consumable, PLAYER1)).toEqual(100);
  });

  it('should not change limit if not the minter', async () => {
    const consumable = await createLimitedConsumable();

    await expectRevert(
      consumable.increaseLimit(PLAYER1, 100, { from: PLAYER2 }),
      'Caller does not have the Minter role',
    );

    expect<number>(await getLimit(consumable, PLAYER1)).toEqual(0);

    expect<number>(await getLimit(consumable, PLAYER2)).toEqual(0);
  });

  it('should not increase the limit if disabled', async () => {
    const consumable = await createLimitedConsumable();

    await disableContract(consumable, CONSUMABLE_MINTER);

    await expectRevert(consumable.increaseLimit(PLAYER1, 100, { from: CONSUMABLE_MINTER }), 'Contract is disabled');
  });
});

describe('decreaseLimit', () => {
  it('should decrease the limit of the account', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1, 200);
    await increaseLimit(consumable, PLAYER2, 500);

    await consumable.decreaseLimit(PLAYER1, 100, { from: CONSUMABLE_MINTER });

    expect<number>(await getLimit(consumable, PLAYER1)).toEqual(100);

    await consumable.decreaseLimit(PLAYER2, 200, { from: CONSUMABLE_MINTER });

    expect<number>(await getLimit(consumable, PLAYER2)).toEqual(300);

    await consumable.decreaseLimit(PLAYER1, 50, { from: CONSUMABLE_MINTER });

    expect<number>(await getLimit(consumable, PLAYER1)).toEqual(50);
    expect<number>(await getLimit(consumable, PLAYER2)).toEqual(300);
  });

  it('should not change limit if would go below 0', async () => {
    const consumable = await createLimitedConsumable();

    await expectRevert(consumable.decreaseLimit(PLAYER1, 1, { from: CONSUMABLE_MINTER }), 'decreased limit below zero');

    expect<number>(await getLimit(consumable, PLAYER1)).toEqual(0);

    await increaseLimit(consumable, PLAYER1, 100);

    await expectRevert(
      consumable.decreaseLimit(PLAYER1, 101, { from: CONSUMABLE_MINTER }),
      'decreased limit below zero',
    );

    expect<number>(await getLimit(consumable, PLAYER1)).toEqual(100);
  });

  it('should not change limit if not the minter', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1, 100);
    await increaseLimit(consumable, PLAYER2, 200);

    await expectRevert(
      consumable.decreaseLimit(PLAYER1, 50, { from: PLAYER2 }),
      'Caller does not have the Minter role',
    );

    expect<number>(await getLimit(consumable, PLAYER1)).toEqual(100);
    expect<number>(await getLimit(consumable, PLAYER2)).toEqual(200);

    await expectRevert(
      consumable.decreaseLimit(PLAYER1, 100, { from: PLAYER2 }),
      'Caller does not have the Minter role',
    );

    expect<number>(await getLimit(consumable, PLAYER1)).toEqual(100);
    expect<number>(await getLimit(consumable, PLAYER2)).toEqual(200);
  });

  it('should not decrease the limit if disabled', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1, 200);

    await disableContract(consumable, CONSUMABLE_MINTER);

    await expectRevert(consumable.decreaseLimit(PLAYER1, 100, { from: CONSUMABLE_MINTER }), 'Contract is disabled');
  });
});

describe('transfer', () => {
  it('should transfer if the receiver does not have a limit', async () => {
    const consumable = await createLimitedConsumable();

    await mintConsumable(consumable, PLAYER1, 100);
    await mintConsumable(consumable, PLAYER2, 500);

    await consumable.transfer(PLAYER1, 50, { from: PLAYER2 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(150);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(450);

    await consumable.transfer(PLAYER1, 50, { from: PLAYER2 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(200);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(400);

    await consumable.transfer(PLAYER2, 75, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(125);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(475);

    await consumable.transfer(PLAYER2, 25, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(500);
  });

  it('should transfer if the receiver will not be over the limit', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1, 200);
    await increaseLimit(consumable, PLAYER2, 500);

    await mintConsumable(consumable, PLAYER1, 100);
    await mintConsumable(consumable, PLAYER2, 500);

    await consumable.transfer(PLAYER1, 50, { from: PLAYER2 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(150);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(450);

    await consumable.transfer(PLAYER1, 50, { from: PLAYER2 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(200);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(400);

    await consumable.transfer(PLAYER2, 75, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(125);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(475);

    await consumable.transfer(PLAYER2, 25, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(500);
  });

  it('should not transfer if the receiver would go over the limit', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1, 200);
    await increaseLimit(consumable, PLAYER2, 500);

    await mintConsumable(consumable, PLAYER1, 100);
    await mintConsumable(consumable, PLAYER2, 450);

    await expectRevert(consumable.transfer(PLAYER1, 101, { from: PLAYER2 }), 'account balance over the limit');

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(450);

    await expectRevert(consumable.transfer(PLAYER1, 150, { from: PLAYER2 }), 'account balance over the limit');

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(450);

    await expectRevert(consumable.transfer(PLAYER2, 51, { from: PLAYER1 }), 'account balance over the limit');

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(450);

    await expectRevert(consumable.transfer(PLAYER2, 100, { from: PLAYER1 }), 'account balance over the limit');

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(450);
  });
});

describe('transferFrom', () => {
  it('should transfer if the receiver does not have a limit', async () => {
    const consumable = await createLimitedConsumable();

    await mintConsumable(consumable, PLAYER1, 100);
    await mintConsumable(consumable, PLAYER2, 500);

    await increaseAllowance(consumable, PLAYER2, PLAYER1, 50);
    await consumable.transferFrom(PLAYER2, PLAYER1, 50, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(150);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(450);

    await increaseAllowance(consumable, PLAYER2, PLAYER1, 50);
    await consumable.transferFrom(PLAYER2, PLAYER1, 50, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(200);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(400);

    await increaseAllowance(consumable, PLAYER1, PLAYER2, 75);
    await consumable.transferFrom(PLAYER1, PLAYER2, 75, { from: PLAYER2 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(125);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(475);

    await increaseAllowance(consumable, PLAYER1, PLAYER2, 25);
    await consumable.transferFrom(PLAYER1, PLAYER2, 25, { from: PLAYER2 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(500);
  });

  it('should transfer if the receiver will not be over the limit', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1, 200);
    await increaseLimit(consumable, PLAYER2, 500);

    await mintConsumable(consumable, PLAYER1, 100);
    await mintConsumable(consumable, PLAYER2, 500);

    await increaseAllowance(consumable, PLAYER2, PLAYER1, 50);
    await consumable.transferFrom(PLAYER2, PLAYER1, 50, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(150);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(450);

    await increaseAllowance(consumable, PLAYER2, PLAYER1, 50);
    await consumable.transferFrom(PLAYER2, PLAYER1, 50, { from: PLAYER1 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(200);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(400);

    await increaseAllowance(consumable, PLAYER1, PLAYER2, 75);
    await consumable.transferFrom(PLAYER1, PLAYER2, 75, { from: PLAYER2 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(125);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(475);

    await increaseAllowance(consumable, PLAYER1, PLAYER2, 25);
    await consumable.transferFrom(PLAYER1, PLAYER2, 25, { from: PLAYER2 });

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(500);
  });

  it('should not transfer if the receiver would go over the limit', async () => {
    const consumable = await createLimitedConsumable();

    await increaseLimit(consumable, PLAYER1, 200);
    await increaseLimit(consumable, PLAYER2, 500);

    await mintConsumable(consumable, PLAYER1, 100);
    await mintConsumable(consumable, PLAYER2, 450);

    await increaseAllowance(consumable, PLAYER2, PLAYER1, 101);
    await expectRevert(
      consumable.transferFrom(PLAYER2, PLAYER1, 101, { from: PLAYER1 }),
      'account balance over the limit',
    );

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(450);

    await increaseAllowance(consumable, PLAYER2, PLAYER1, 49);
    await expectRevert(
      consumable.transferFrom(PLAYER2, PLAYER1, 150, { from: PLAYER1 }),
      'account balance over the limit',
    );

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(450);

    await increaseAllowance(consumable, PLAYER1, PLAYER2, 51);
    await expectRevert(
      consumable.transferFrom(PLAYER1, PLAYER2, 51, { from: PLAYER1 }),
      'account balance over the limit',
    );

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(450);

    await increaseAllowance(consumable, PLAYER1, PLAYER2, 49);
    await expectRevert(
      consumable.transferFrom(PLAYER1, PLAYER2, 100, { from: PLAYER1 }),
      'account balance over the limit',
    );

    expect<number>(await getBalance(consumable, PLAYER1)).toEqual(100);
    expect<number>(await getBalance(consumable, PLAYER2)).toEqual(450);
  });
});

describe('Enable/Disable', () => {
  shouldRestrictEnableAndDisable(createLimitedConsumable, CONSUMABLE_MINTER);
});

describe('transferToken', () => {
  shouldTransferToken(createLimitedConsumable, { superAdmin: CONSUMABLE_MINTER });
});

describe('transferItem', () => {
  shouldTransferItem(createLimitedConsumable, { superAdmin: CONSUMABLE_MINTER });
});
