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
import { ARTIFACT_MINTER, PLAYER1, PLAYER2, PLAYER3 } from '../../../helpers/Accounts';
import { createArtifact, mintItem } from '../../../helpers/ArtifactHelper';
import { createConsumable, mintConsumable } from '../../../helpers/ConsumableHelper';
import {
  ARTIFACT_ID,
  BASE_CONTRACT_ID,
  CONSUMABLE_PROVIDER_ID,
  ERC165_ID,
  TRANSFERRING_ID,
} from '../../../helpers/ContractIds';
import { disableContract } from '../../../helpers/DisableableHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createArtifact, ERC165_ID);
  shouldSupportInterface('BaseContract', createArtifact, BASE_CONTRACT_ID);
  shouldSupportInterface('Artifact', createArtifact, ARTIFACT_ID);
  shouldSupportInterface('ConsumableProvider', createArtifact, CONSUMABLE_PROVIDER_ID);
  shouldSupportInterface('Transfer', createArtifact, TRANSFERRING_ID);
});

describe('initialUses', () => {
  it('should return the correct number', async () => {
    const artifact = await createArtifact({}, '', '', [], 3);

    expect<BigNumber>(await artifact.initialUses()).toEqBN(3);
  });

  it('should return the same number no matter how many items are minted', async () => {
    const artifact = await createArtifact({}, '', '', [], 3);

    await mintItem(artifact, PLAYER1.address);

    expect<BigNumber>(await artifact.initialUses()).toEqBN(3);

    await mintItem(artifact, PLAYER2.address);

    expect<BigNumber>(await artifact.initialUses()).toEqBN(3);

    await mintItem(artifact, PLAYER3.address);

    expect<BigNumber>(await artifact.initialUses()).toEqBN(3);
  });
});

describe('usesLeft', () => {
  it('should return the initial uses when an item has yet to been used', async () => {
    const artifact = await createArtifact({}, '', '', [], 3);

    await mintItem(artifact, PLAYER1.address);
    await mintItem(artifact, PLAYER2.address);

    expect<BigNumber>(await artifact.usesLeft(1)).toEqBN(3);
    expect<BigNumber>(await artifact.usesLeft(2)).toEqBN(3);
  });

  it('should return the number of uses left for an item', async () => {
    const artifact = await createArtifact({}, '', '', [], 3);

    await mintItem(artifact, PLAYER1.address);
    await mintItem(artifact, PLAYER2.address);

    await artifact.connect(PLAYER1).useItem(1, PLAYER2.address);

    expect<BigNumber>(await artifact.usesLeft(1)).toEqBN(2);
    expect<BigNumber>(await artifact.usesLeft(2)).toEqBN(3);

    await artifact.connect(PLAYER1).useItem(1, PLAYER3.address);

    expect<BigNumber>(await artifact.usesLeft(1)).toEqBN(1);
    expect<BigNumber>(await artifact.usesLeft(2)).toEqBN(3);

    await artifact.connect(PLAYER1).useItem(1, PLAYER2.address);

    expect<BigNumber>(await artifact.usesLeft(1)).toEqBN(0);
    expect<BigNumber>(await artifact.usesLeft(2)).toEqBN(3);

    await artifact.connect(PLAYER2).useItem(2, PLAYER1.address);

    expect<BigNumber>(await artifact.usesLeft(1)).toEqBN(0);
    expect<BigNumber>(await artifact.usesLeft(2)).toEqBN(2);
  });
});

describe('totalUsesLeft', () => {
  it('should return 0 when there are no items', async () => {
    const artifact = await createArtifact({}, '', '', [], 3);

    expect<BigNumber>(await artifact.totalUsesLeft()).toEqBN(0);
  });

  it('should return multiple of initialUses when no items have been used', async () => {
    const artifact = await createArtifact({}, '', '', [], 3);

    await mintItem(artifact, PLAYER1.address);
    await mintItem(artifact, PLAYER2.address);

    expect<BigNumber>(await artifact.totalUsesLeft()).toEqBN(6);
  });

  it('should return the number of uses left for all items', async () => {
    const artifact = await createArtifact({}, '', '', [], 3);

    await mintItem(artifact, PLAYER1.address);
    await mintItem(artifact, PLAYER2.address);

    await artifact.connect(PLAYER1).useItem(1, PLAYER2.address);

    expect<BigNumber>(await artifact.totalUsesLeft()).toEqBN(5);

    await artifact.connect(PLAYER1).useItem(1, PLAYER3.address);

    expect<BigNumber>(await artifact.totalUsesLeft()).toEqBN(4);

    await artifact.connect(PLAYER2).useItem(2, PLAYER1.address);

    expect<BigNumber>(await artifact.totalUsesLeft()).toEqBN(3);

    await artifact.connect(PLAYER1).useItem(1, PLAYER2.address);

    expect<BigNumber>(await artifact.totalUsesLeft()).toEqBN(2);

    await artifact.connect(PLAYER2).useItem(2, PLAYER3.address);

    expect<BigNumber>(await artifact.totalUsesLeft()).toEqBN(1);

    await artifact.connect(PLAYER2).useItem(2, PLAYER1.address);

    expect<BigNumber>(await artifact.totalUsesLeft()).toEqBN(0);
  });
});

describe('useItem', () => {
  it('should provide consumables to the receiver if there are uses left', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const artifact = await createArtifact(
      withDefaultContractInfo({}),
      '',
      '',
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
      2,
    );

    await mintConsumable(consumable1, artifact.address, 1000);
    await mintConsumable(consumable2, artifact.address, 1000);

    await mintItem(artifact, PLAYER1.address);
    await mintItem(artifact, PLAYER2.address);

    await artifact.connect(PLAYER1).useItem(1, PLAYER2.address);

    expect<BigNumber>(await consumable1.allowance(artifact.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(artifact.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(artifact.address, PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(artifact.address, PLAYER2.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(artifact.address, PLAYER2.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.allowance(artifact.address, PLAYER2.address)).toEqBN(0);

    expect<BigNumber>(await artifact.usesLeft(1)).toEqBN(1);
    expect<BigNumber>(await artifact.usesLeft(2)).toEqBN(2);

    await artifact.connect(PLAYER1).useItem(1, PLAYER2.address);

    expect<BigNumber>(await consumable1.allowance(artifact.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(artifact.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(artifact.address, PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(artifact.address, PLAYER2.address)).toEqBN(200);
    expect<BigNumber>(await consumable2.allowance(artifact.address, PLAYER2.address)).toEqBN(400);
    expect<BigNumber>(await consumable3.allowance(artifact.address, PLAYER2.address)).toEqBN(0);

    expect<BigNumber>(await artifact.usesLeft(1)).toEqBN(0);
    expect<BigNumber>(await artifact.usesLeft(2)).toEqBN(2);

    await artifact.connect(PLAYER2).useItem(2, PLAYER1.address);

    expect<BigNumber>(await consumable1.allowance(artifact.address, PLAYER1.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.allowance(artifact.address, PLAYER1.address)).toEqBN(200);
    expect<BigNumber>(await consumable3.allowance(artifact.address, PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(artifact.address, PLAYER2.address)).toEqBN(200);
    expect<BigNumber>(await consumable2.allowance(artifact.address, PLAYER2.address)).toEqBN(400);
    expect<BigNumber>(await consumable3.allowance(artifact.address, PLAYER2.address)).toEqBN(0);

    expect<BigNumber>(await artifact.usesLeft(1)).toEqBN(0);
    expect<BigNumber>(await artifact.usesLeft(2)).toEqBN(1);
  });

  it('should not provide consumables if there are no uses left', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const artifact = await createArtifact(
      withDefaultContractInfo({}),
      '',
      '',
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
      2,
    );

    await mintConsumable(consumable1, artifact.address, 1000);
    await mintConsumable(consumable2, artifact.address, 1000);

    await mintItem(artifact, PLAYER1.address);

    await artifact.connect(PLAYER1).useItem(1, PLAYER2.address);
    await artifact.connect(PLAYER1).useItem(1, PLAYER2.address);

    expect<BigNumber>(await consumable1.allowance(artifact.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(artifact.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(artifact.address, PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(artifact.address, PLAYER2.address)).toEqBN(200);
    expect<BigNumber>(await consumable2.allowance(artifact.address, PLAYER2.address)).toEqBN(400);
    expect<BigNumber>(await consumable3.allowance(artifact.address, PLAYER2.address)).toEqBN(0);

    expect<BigNumber>(await artifact.usesLeft(1)).toEqBN(0);

    await expect<Promise<ContractTransaction>>(artifact.connect(PLAYER1).useItem(1, PLAYER2.address)).toBeRevertedWith(
      'Artifact: no uses left for item',
    );

    expect<BigNumber>(await consumable1.allowance(artifact.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(artifact.address, PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable3.allowance(artifact.address, PLAYER1.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.allowance(artifact.address, PLAYER2.address)).toEqBN(200);
    expect<BigNumber>(await consumable2.allowance(artifact.address, PLAYER2.address)).toEqBN(400);
    expect<BigNumber>(await consumable3.allowance(artifact.address, PLAYER2.address)).toEqBN(0);

    expect<BigNumber>(await artifact.usesLeft(1)).toEqBN(0);
  });

  it('should not use the item if called by someone other than the owner', async () => {
    const artifact = await createArtifact({}, '', '', [], 3);

    await mintItem(artifact, PLAYER1.address);
    await mintItem(artifact, PLAYER2.address);

    await expect<Promise<ContractTransaction>>(artifact.connect(PLAYER2).useItem(1, PLAYER1.address)).toBeRevertedWith(
      'Artifact: must be used by the owner',
    );

    expect<BigNumber>(await artifact.usesLeft(1)).toEqBN(3);
    expect<BigNumber>(await artifact.usesLeft(2)).toEqBN(3);

    await expect<Promise<ContractTransaction>>(artifact.connect(PLAYER1).useItem(2, PLAYER2.address)).toBeRevertedWith(
      'Artifact: must be used by the owner',
    );

    expect<BigNumber>(await artifact.usesLeft(1)).toEqBN(3);
    expect<BigNumber>(await artifact.usesLeft(2)).toEqBN(3);
  });

  it('should not use item if disabled', async () => {
    const artifact = await createArtifact();

    await disableContract(artifact, ARTIFACT_MINTER);

    await expect<Promise<ContractTransaction>>(artifact.connect(PLAYER1).useItem(1, PLAYER2.address)).toBeRevertedWith(
      'Contract is disabled',
    );
  });

  it('should emit Used event', async () => {
    const artifact = await createArtifact({}, '', '', [], 3);

    await mintItem(artifact, PLAYER1.address);
    await mintItem(artifact, PLAYER2.address);

    await expect<ContractTransaction>(
      await artifact.connect(PLAYER1).useItem(1, PLAYER2.address),
    ).toHaveEmittedWith(artifact, 'Used', [PLAYER1.address, PLAYER2.address, '1']);

    await expect<ContractTransaction>(
      await artifact.connect(PLAYER2).useItem(2, PLAYER1.address),
    ).toHaveEmittedWith(artifact, 'Used', [PLAYER2.address, PLAYER1.address, '2']);
  });
});
