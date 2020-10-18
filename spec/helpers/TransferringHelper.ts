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
import { INITIALIZER, PLAYER3 } from './Accounts';
import { createArtifact, mintItem } from './ArtifactHelper';
import {
  createConsumable,
  createConsumableExchange,
  createConvertibleConsumable,
  getAllowance,
  getBalance,
  mintConsumable,
} from './ConsumableHelper';
import { getContract } from './ContractHelper';
import { disableContract } from './DisableableHelper';

export const TransferringContract = getContract('TestTransfer');
export const ExchangingTransferringContract = getContract('TestExchangingTransfer');

export const createTransferring = async () => {
  const transferring = await TransferringContract.new();
  await transferring.initializeTestTransfer({ from: INITIALIZER });
  return transferring;
};

export const createExchangingTransferring = async () => {
  const transferring = await ExchangingTransferringContract.new();
  await transferring.initializeExchangingTestTransfer({ from: INITIALIZER });
  return transferring;
};

interface TransferOptions {
  superAdmin?: string;
  admin?: string;
  transferAgent?: string;
  usingOwner?: boolean;
}

export interface TransferTokenOptions extends TransferOptions {
  withExchange?: boolean;
}

export const shouldTransferToken = (create: () => any, options: TransferTokenOptions = {}) => {
  const withExchange = Boolean(options.withExchange);
  const superAdmin = options.superAdmin || INITIALIZER;
  const usingOwner = Boolean(options.usingOwner);
  const admin = options.admin || superAdmin;
  const transferAgent = options.transferAgent || superAdmin;
  const invalidRoleError = buildInvalidRoleError(usingOwner);

  it('should transfer consumable to another address', async () => {
    const transferring = await create();

    const consumable = await createConsumable();
    await mintConsumable(consumable, transferring.address, 1000);

    await transferring.transferToken(consumable.address, 100, PLAYER3, { from: transferAgent });

    expect(await getBalance(consumable, transferring.address)).toEqual(900);
    expect(await getBalance(consumable, PLAYER3)).toEqual(100);
  });

  if (withExchange) {
    it('should transfer convertible consumable to another address', async () => {
      const transferring = await create();

      const exchangeConsumable = await createConsumableExchange({ name: 'Exchange' });
      const consumable1 = await createConvertibleConsumable(
        exchangeConsumable.address,
        { name: 'Consumable' },
        '',
        10,
        100,
        true,
        undefined,
      );

      await mintConsumable(exchangeConsumable, transferring.address, 100);

      await transferring.transferToken(consumable1.address, 100, PLAYER3, { from: transferAgent });

      expect(await getBalance(exchangeConsumable, transferring.address)).toEqual(90);
      expect(await getBalance(exchangeConsumable, PLAYER3)).toEqual(0);
      expect(await getAllowance(exchangeConsumable, PLAYER3, consumable1.address)).toEqual(0);
      expect(await getBalance(consumable1, transferring.address)).toEqual(0);
      expect(await getBalance(consumable1, PLAYER3)).toEqual(100);
      expect(await getAllowance(consumable1, consumable1.address, PLAYER3)).toEqual(0);

      await transferring.transferToken(consumable1.address, 101, PLAYER3, { from: transferAgent });

      expect(await getBalance(exchangeConsumable, transferring.address)).toEqual(79);
      expect(await getBalance(exchangeConsumable, PLAYER3)).toEqual(0);
      expect(await getAllowance(exchangeConsumable, PLAYER3, consumable1.address)).toEqual(0);
      expect(await getBalance(consumable1, transferring.address)).toEqual(0);
      expect(await getBalance(consumable1, PLAYER3)).toEqual(201);
      expect(await getAllowance(consumable1, consumable1.address, PLAYER3)).toEqual(0);

      const consumable2 = await createConvertibleConsumable(
        exchangeConsumable.address,
        { name: 'Consumable 2' },
        '',
        1,
        1000000,
        true,
        undefined,
      );

      await transferring.transferToken(consumable2.address, 10, PLAYER3, { from: transferAgent });

      expect(await getBalance(exchangeConsumable, transferring.address)).toEqual(69);
      expect(await getBalance(exchangeConsumable, PLAYER3)).toEqual(0);
      expect(await getAllowance(exchangeConsumable, PLAYER3, consumable1.address)).toEqual(0);
      expect(await getBalance(consumable2, transferring.address)).toEqual(0);
      expect(await getBalance(consumable2, PLAYER3)).toEqual(10);
      expect(await getAllowance(consumable2, consumable1.address, PLAYER3)).toEqual(0);

      await transferring.transferToken(consumable2.address, 11, PLAYER3, { from: transferAgent });

      expect(await getBalance(exchangeConsumable, transferring.address)).toEqual(58);
      expect(await getBalance(exchangeConsumable, PLAYER3)).toEqual(0);
      expect(await getAllowance(exchangeConsumable, PLAYER3, consumable1.address)).toEqual(0);
      expect(await getBalance(consumable2, transferring.address)).toEqual(0);
      expect(await getBalance(consumable2, PLAYER3)).toEqual(21);
      expect(await getAllowance(consumable2, consumable1.address, PLAYER3)).toEqual(0);
    });
  }

  it('should not transfer if not enough consumable', async () => {
    const transferring = await create();

    const consumable = await createConsumable();
    await mintConsumable(consumable, transferring.address, 99);

    await expectRevert(
      transferring.transferToken(consumable.address, 100, PLAYER3, { from: transferAgent }),
      'transfer amount exceeds balance',
    );

    expect(await getBalance(consumable, transferring.address)).toEqual(99);
    expect(await getBalance(consumable, PLAYER3)).toEqual(0);
  });

  if (withExchange) {
    it('should not transfer convertible consumable if not enough exchange', async () => {
      const transferring = await create();

      const exchangeConsumable = await createConsumableExchange({ name: 'Exchange' });
      const consumable = await createConvertibleConsumable(
        exchangeConsumable.address,
        { name: 'Consumable' },
        '',
        10,
        10,
        true,
        undefined,
      );

      await mintConsumable(exchangeConsumable, consumable.address, 10);
      await mintConsumable(consumable, transferring.address, 99);

      await expectRevert(
        transferring.transferToken(consumable.address, 100, PLAYER3, { from: transferAgent }),
        'transfer amount exceeds balance',
      );

      expect(await getBalance(exchangeConsumable, transferring.address)).toEqual(0);
      expect(await getBalance(exchangeConsumable, PLAYER3)).toEqual(0);

      expect(await getBalance(consumable, transferring.address)).toEqual(99);
      expect(await getBalance(consumable, PLAYER3)).toEqual(0);
    });
  }

  it('should not transfer if caller is not transfer agent', async () => {
    const transferring = await create();

    const consumable = await createConsumable();
    await mintConsumable(consumable, transferring.address, 1000);

    await expectRevert(
      transferring.transferToken(consumable.address, 100, PLAYER3, { from: PLAYER3 }),
      invalidRoleError,
    );

    expect(await getBalance(consumable, transferring.address)).toEqual(1000);
    expect(await getBalance(consumable, PLAYER3)).toEqual(0);
  });

  it('should not transfer if transfer is disabled', async () => {
    const transferring = await create();

    const consumable = await createConsumable();
    await mintConsumable(consumable, transferring.address, 1000);

    await disableContract(transferring, admin);

    await expectRevert(
      transferring.transferToken(consumable.address, 100, PLAYER3, { from: transferAgent }),
      'Contract is disabled',
    );

    expect(await getBalance(consumable, transferring.address)).toEqual(1000);
    expect(await getBalance(consumable, PLAYER3)).toEqual(0);
  });
};

export const shouldTransferItem = (create: () => any, options: TransferOptions = {}) => {
  const superAdmin = options.superAdmin || INITIALIZER;
  const usingOwner = Boolean(options.usingOwner);
  const admin = usingOwner ? superAdmin : superAdmin;
  const transferAgent = usingOwner ? superAdmin : superAdmin;
  const invalidRoleError = buildInvalidRoleError(usingOwner);

  it('should transfer item to another address', async () => {
    const transferring = await create();

    const artifact = await createArtifact();
    await mintItem(artifact, transferring.address);
    await mintItem(artifact, transferring.address);

    await transferring.transferItem(artifact.address, 1, PLAYER3, { from: transferAgent });

    expect(await artifact.ownerOf(1)).toEqual(PLAYER3);
    expect(await artifact.ownerOf(2)).toEqual(transferring.address);
  });

  it('should not transfer if not valid item', async () => {
    const transferring = await create();

    const artifact = await createArtifact();
    await mintItem(artifact, transferring.address);

    await expectRevert(
      transferring.transferItem(artifact.address, 2, PLAYER3, { from: transferAgent }),
      'operator query for nonexistent token',
    );

    expect(await artifact.ownerOf(1)).toEqual(transferring.address);
  });

  it('should not transfer if caller is not transfer agent', async () => {
    const transferring = await create();

    const artifact = await createArtifact();
    await mintItem(artifact, transferring.address);

    await expectRevert(transferring.transferItem(artifact.address, 1, PLAYER3, { from: PLAYER3 }), invalidRoleError);

    expect(await artifact.ownerOf(1)).toEqual(transferring.address);
  });

  it('should not transfer if transfer is disabled', async () => {
    const transferring = await create();

    const artifact = await createArtifact();
    await mintItem(artifact, transferring.address);

    await disableContract(transferring, admin);

    await expectRevert(
      transferring.transferItem(artifact.address, 1, PLAYER3, { from: transferAgent }),
      'Contract is disabled',
    );

    expect(await artifact.ownerOf(1)).toEqual(transferring.address);
  });
};

const buildInvalidRoleError = (usingOwner: boolean) =>
  usingOwner ? 'caller is not the owner' : 'Caller does not have the Transfer Agent role';
