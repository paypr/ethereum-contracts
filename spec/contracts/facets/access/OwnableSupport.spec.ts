/*
 * Copyright (c) 2022 The Paypr Company, LLC
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

import { buildDiamondFacetCut } from '../../../../src/contracts/diamonds';
import { TestCheckOwner__factory } from '../../../../types/contracts';
import { OWNER_MANAGER, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { createOwnable, deployTestCheckOwner } from '../../../helpers/facets/OwnableFacetHelper';

describe('checkOwner', () => {
  it('should succeed when caller is the owner', async () => {
    const ownable = await createOwnable(PLAYER1.address, {
      additionalCuts: [buildDiamondFacetCut(await deployTestCheckOwner())],
    });
    const ownerCheck = TestCheckOwner__factory.connect(ownable.address, ownable.signer);

    await ownerCheck.connect(PLAYER1).needsOwner();

    await ownable.connect(PLAYER1).transferOwnership(PLAYER2.address);

    await ownerCheck.connect(PLAYER2).needsOwner();
  });

  it('should revert when caller is not the owner', async () => {
    const ownable = await createOwnable(PLAYER1.address, {
      additionalCuts: [buildDiamondFacetCut(await deployTestCheckOwner())],
    });
    const ownerCheck = TestCheckOwner__factory.connect(ownable.address, ownable.signer);

    await expect(ownerCheck.connect(PLAYER2.address).needsOwner()).toBeRevertedWith('caller is not the owner');
    await expect(ownerCheck.connect(OWNER_MANAGER.address).needsOwner()).toBeRevertedWith('caller is not the owner');
  });
});
