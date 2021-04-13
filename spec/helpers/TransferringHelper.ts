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

import { BigNumber, ContractTransaction, Signer } from 'ethers';
import {
  IDisableable,
  ITransferring,
  TestExchangingTransfer__factory,
  TestTransfer__factory,
} from '../../types/contracts';
import { INITIALIZER, PLAYER3 } from './Accounts';
import { createArtifact, mintItem } from './ArtifactHelper';
import {
  createConsumable,
  createConsumableExchange,
  createConvertibleConsumable,
  mintConsumable,
} from './ConsumableHelper';
import { disableContract } from './DisableableHelper';

export const deployTransferringContract = () => new TestTransfer__factory(INITIALIZER).deploy();
export const deployExchangingTransferringContract = () => new TestExchangingTransfer__factory(INITIALIZER).deploy();

export const createTransferring = async () => {
  const transferring = await deployTransferringContract();
  await transferring.initializeTestTransfer();
  return transferring;
};

export const createExchangingTransferring = async () => {
  const transferring = await deployExchangingTransferringContract();
  await transferring.initializeExchangingTestTransfer();
  return transferring;
};

interface TransferOptions {
  getSuperAdmin?: () => Signer;
  getAdmin?: () => Signer;
  getTransferAgent?: () => Signer;
  usingOwner?: boolean;
}

export interface TransferTokenOptions extends TransferOptions {
  withExchange?: boolean;
}

type TransferringContract = ITransferring & IDisableable;

export const shouldTransferToken = (
  create: () => Promise<TransferringContract>,
  options: TransferTokenOptions = {},
) => {
  const withExchange = Boolean(options.withExchange);
  const getSuperAdmin = options.getSuperAdmin || (() => INITIALIZER);
  const usingOwner = Boolean(options.usingOwner);
  const getAdmin = options.getAdmin || getSuperAdmin;
  const getTransferAgent = options.getTransferAgent || getSuperAdmin;
  const invalidRoleError = buildInvalidRoleError(usingOwner);

  it('should transfer consumable to another address', async () => {
    const transferring = await create();

    const consumable = await createConsumable();
    await mintConsumable(consumable, transferring.address, 1000);

    await transferring.connect(getTransferAgent()).transferToken(consumable.address, 100, PLAYER3.address);

    expect<BigNumber>(await consumable.balanceOf(transferring.address)).toEqBN(900);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(100);
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

      await transferring.connect(getTransferAgent()).transferToken(consumable1.address, 100, PLAYER3.address);

      expect<BigNumber>(await exchangeConsumable.balanceOf(transferring.address)).toEqBN(90);
      expect<BigNumber>(await exchangeConsumable.balanceOf(PLAYER3.address)).toEqBN(0);
      expect<BigNumber>(await exchangeConsumable.allowance(PLAYER3.address, consumable1.address)).toEqBN(0);
      expect<BigNumber>(await consumable1.balanceOf(transferring.address)).toEqBN(0);
      expect<BigNumber>(await consumable1.balanceOf(PLAYER3.address)).toEqBN(100);
      expect<BigNumber>(await consumable1.allowance(consumable1.address, PLAYER3.address)).toEqBN(0);

      await transferring.connect(getTransferAgent()).transferToken(consumable1.address, 101, PLAYER3.address);

      expect<BigNumber>(await exchangeConsumable.balanceOf(transferring.address)).toEqBN(79);
      expect<BigNumber>(await exchangeConsumable.balanceOf(PLAYER3.address)).toEqBN(0);
      expect<BigNumber>(await exchangeConsumable.allowance(PLAYER3.address, consumable1.address)).toEqBN(0);
      expect<BigNumber>(await consumable1.balanceOf(transferring.address)).toEqBN(0);
      expect<BigNumber>(await consumable1.balanceOf(PLAYER3.address)).toEqBN(201);
      expect<BigNumber>(await consumable1.allowance(consumable1.address, PLAYER3.address)).toEqBN(0);

      const consumable2 = await createConvertibleConsumable(
        exchangeConsumable.address,
        { name: 'Consumable 2' },
        '',
        1,
        1000000,
        true,
        undefined,
      );

      await transferring.connect(getTransferAgent()).transferToken(consumable2.address, 10, PLAYER3.address);

      expect<BigNumber>(await exchangeConsumable.balanceOf(transferring.address)).toEqBN(69);
      expect<BigNumber>(await exchangeConsumable.balanceOf(PLAYER3.address)).toEqBN(0);
      expect<BigNumber>(await exchangeConsumable.allowance(PLAYER3.address, consumable1.address)).toEqBN(0);
      expect<BigNumber>(await consumable2.balanceOf(transferring.address)).toEqBN(0);
      expect<BigNumber>(await consumable2.balanceOf(PLAYER3.address)).toEqBN(10);
      expect<BigNumber>(await consumable2.allowance(consumable1.address, PLAYER3.address)).toEqBN(0);

      await transferring.connect(getTransferAgent()).transferToken(consumable2.address, 11, PLAYER3.address);

      expect<BigNumber>(await exchangeConsumable.balanceOf(transferring.address)).toEqBN(58);
      expect<BigNumber>(await exchangeConsumable.balanceOf(PLAYER3.address)).toEqBN(0);
      expect<BigNumber>(await exchangeConsumable.allowance(PLAYER3.address, consumable1.address)).toEqBN(0);
      expect<BigNumber>(await consumable2.balanceOf(transferring.address)).toEqBN(0);
      expect<BigNumber>(await consumable2.balanceOf(PLAYER3.address)).toEqBN(21);
      expect<BigNumber>(await consumable2.allowance(consumable1.address, PLAYER3.address)).toEqBN(0);
    });
  }

  it('should not transfer if not enough consumable', async () => {
    const transferring = await create();

    const consumable = await createConsumable();
    await mintConsumable(consumable, transferring.address, 99);

    await expect<Promise<ContractTransaction>>(
      transferring.connect(getTransferAgent()).transferToken(consumable.address, 100, PLAYER3.address),
    ).toBeRevertedWith('transfer amount exceeds balance');

    expect<BigNumber>(await consumable.balanceOf(transferring.address)).toEqBN(99);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(0);
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

      await expect<Promise<ContractTransaction>>(
        transferring.connect(getTransferAgent()).transferToken(consumable.address, 100, PLAYER3.address),
      ).toBeRevertedWith('transfer amount exceeds balance');

      expect<BigNumber>(await exchangeConsumable.balanceOf(transferring.address)).toEqBN(0);
      expect<BigNumber>(await exchangeConsumable.balanceOf(PLAYER3.address)).toEqBN(0);

      expect<BigNumber>(await consumable.balanceOf(transferring.address)).toEqBN(99);
      expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(0);
    });
  }

  it('should not transfer if caller is not transfer agent', async () => {
    const transferring = await create();

    const consumable = await createConsumable();
    await mintConsumable(consumable, transferring.address, 1000);

    await expect<Promise<ContractTransaction>>(
      transferring.connect(PLAYER3).transferToken(consumable.address, 100, PLAYER3.address),
    ).toBeRevertedWith(invalidRoleError);

    expect<BigNumber>(await consumable.balanceOf(transferring.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(0);
  });

  it('should not transfer if transfer is disabled', async () => {
    const transferring = await create();

    const consumable = await createConsumable();
    await mintConsumable(consumable, transferring.address, 1000);

    await disableContract(transferring, getAdmin());

    await expect<Promise<ContractTransaction>>(
      transferring.connect(getTransferAgent()).transferToken(consumable.address, 100, PLAYER3.address),
    ).toBeRevertedWith('Contract is disabled');

    expect<BigNumber>(await consumable.balanceOf(transferring.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(0);
  });
};

export const shouldTransferItem = (create: () => Promise<TransferringContract>, options: TransferOptions = {}) => {
  const getSuperAdmin = options.getSuperAdmin || (() => INITIALIZER);
  const usingOwner = Boolean(options.usingOwner);
  const getAdmin = usingOwner ? getSuperAdmin : options.getAdmin || getSuperAdmin;
  const getTransferAgent = usingOwner ? getSuperAdmin : options.getTransferAgent || getSuperAdmin;
  const invalidRoleError = buildInvalidRoleError(usingOwner);

  it('should transfer item to another address', async () => {
    const transferring = await create();

    const artifact = await createArtifact();
    await mintItem(artifact, transferring.address);
    await mintItem(artifact, transferring.address);

    await transferring.connect(getTransferAgent()).transferItem(artifact.address, 1, PLAYER3.address);

    expect<string>(await artifact.ownerOf(1)).toEqual(PLAYER3.address);
    expect<string>(await artifact.ownerOf(2)).toEqual(transferring.address);
  });

  it('should not transfer if not valid item', async () => {
    const transferring = await create();

    const artifact = await createArtifact();
    await mintItem(artifact, transferring.address);

    await expect<Promise<ContractTransaction>>(
      transferring.connect(getTransferAgent()).transferItem(artifact.address, 2, PLAYER3.address),
    ).toBeRevertedWith('operator query for nonexistent token');

    expect<string>(await artifact.ownerOf(1)).toEqual(transferring.address);
  });

  it('should not transfer if caller is not transfer agent', async () => {
    const transferring = await create();

    const artifact = await createArtifact();
    await mintItem(artifact, transferring.address);

    await expect<Promise<ContractTransaction>>(
      transferring.connect(PLAYER3).transferItem(artifact.address, 1, PLAYER3.address),
    ).toBeRevertedWith(invalidRoleError);

    expect<string>(await artifact.ownerOf(1)).toEqual(transferring.address);
  });

  it('should not transfer if transfer is disabled', async () => {
    const transferring = await create();

    const artifact = await createArtifact();
    await mintItem(artifact, transferring.address);

    await disableContract(transferring, getAdmin());

    await expect<Promise<ContractTransaction>>(
      transferring.connect(getTransferAgent()).transferItem(artifact.address, 1, PLAYER3.address),
    ).toBeRevertedWith('Contract is disabled');

    expect<string>(await artifact.ownerOf(1)).toEqual(transferring.address);
  });
};

const buildInvalidRoleError = (usingOwner: boolean) =>
  usingOwner ? 'caller is not the owner' : 'Caller does not have the Transfer Agent role';
