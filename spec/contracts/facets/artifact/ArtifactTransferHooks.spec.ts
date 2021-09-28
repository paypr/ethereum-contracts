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
import { PLAYER1, PLAYER3 } from '../../../helpers/Accounts';
import { combineExtensibleDiamondOptions } from '../../../helpers/DiamondHelper';
import { asArtifact, createMintableArtifact } from '../../../helpers/facets/ArtifactFacetHelper';
import { asConsumableMint, createConsumable } from '../../../helpers/facets/ConsumableFacetHelper';
import { buildConsumableProviderDiamondAdditions } from '../../../helpers/facets/ConsumableProviderFacetHelper';
import { asTransferring, buildTransferringDiamondAdditions } from '../../../helpers/facets/TransferFacetHelper';

describe('transferToken', () => {
  it('should transfer token if enough to satisfy total uses', async () => {
    const consumable = await createConsumable();

    const artifactMint = await createMintableArtifact(
      10,
      combineExtensibleDiamondOptions(
        await buildConsumableProviderDiamondAdditions([{ consumable: consumable.address, amount: 10 }]),
        await buildTransferringDiamondAdditions(),
      ),
    );
    const artifact = asArtifact(artifactMint);

    await asConsumableMint(consumable).mint(artifact.address, 1000);
    await artifactMint.mint(PLAYER1.address);
    await artifactMint.mint(PLAYER1.address);

    await asTransferring(artifact).transferToken(consumable.address, 10, PLAYER3.address);

    expect<BigNumber>(await consumable.balanceOf(artifact.address)).toEqBN(990);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(10);
  });

  it('should not transfer token if not enough to satisfy total uses', async () => {
    const consumable = await createConsumable();

    const artifactMint = await createMintableArtifact(
      10,
      combineExtensibleDiamondOptions(
        await buildConsumableProviderDiamondAdditions([{ consumable: consumable.address, amount: 10 }]),
        await buildTransferringDiamondAdditions(),
      ),
    );
    const artifact = asArtifact(artifactMint);

    await asConsumableMint(consumable).mint(artifact.address, 200);
    await artifactMint.mint(PLAYER1.address);
    await artifactMint.mint(PLAYER1.address);

    await expect<Promise<ContractTransaction>>(
      asTransferring(artifactMint).transferToken(consumable.address, 1, PLAYER3.address),
    ).toBeRevertedWith('not enough consumable for items');
  });
});
