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

import { ContractTransaction } from 'ethers/lib/ethers';
import { ZERO_ADDRESS } from '../../../../src/contracts/accounts';
import { buildDiamondFacetCut } from '../../../../src/contracts/diamonds';
import { OWNABLE_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { OWNER_MANAGER, PLAYER1, PLAYER2, PLAYER3 } from '../../../helpers/Accounts';
import { deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import { createOwnable, deployOwnableFacet } from '../../../helpers/facets/OwnableFacetHelper';

describe('supportsInterface', () => {
  const createContract = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployOwnableFacet()),
      ]),
    );

  shouldSupportInterface('Ownable', createContract, OWNABLE_INTERFACE_ID);
});

describe('owner', () => {
  it('should return the current owner', async () => {
    const ownable = await createOwnable(PLAYER1.address);
    expect<string>(await ownable.owner()).toEqual(PLAYER1.address);

    await ownable.connect(PLAYER1).transferOwnership(PLAYER2.address);
    expect<string>(await ownable.owner()).toEqual(PLAYER2.address);
  });

  it('should return the zero address if no owner', async () => {
    const ownable = await createOwnable(PLAYER1.address);
    await ownable.connect(PLAYER1).renounceOwnership();
    expect<string>(await ownable.owner()).toEqual(ZERO_ADDRESS);
  });
});

describe('isOwner', () => {
  it('should return true if passed the current owner and false if not', async () => {
    const ownable = await createOwnable(PLAYER1.address);
    expect<boolean>(await ownable.isOwner(PLAYER1.address)).toBe(true);
    expect<boolean>(await ownable.isOwner(PLAYER2.address)).toBe(false);
    expect<boolean>(await ownable.isOwner(OWNER_MANAGER.address)).toBe(false);

    await ownable.connect(PLAYER1).transferOwnership(PLAYER2.address);
    expect<boolean>(await ownable.isOwner(PLAYER1.address)).toBe(false);
    expect<boolean>(await ownable.isOwner(PLAYER2.address)).toBe(true);
    expect<boolean>(await ownable.isOwner(OWNER_MANAGER.address)).toBe(false);

    await ownable.connect(PLAYER2).renounceOwnership();
    expect<boolean>(await ownable.isOwner(PLAYER1.address)).toBe(false);
    expect<boolean>(await ownable.isOwner(PLAYER2.address)).toBe(false);
    expect<boolean>(await ownable.isOwner(OWNER_MANAGER.address)).toBe(false);
  });
});

describe('renounceOwnership', () => {
  it('should set the owner to the zero address', async () => {
    const ownable = await createOwnable(PLAYER1.address);
    await ownable.connect(PLAYER1).renounceOwnership();
    expect<string>(await ownable.owner()).toEqual(ZERO_ADDRESS);
  });

  it('should revert if not the owner', async () => {
    const ownable = await createOwnable(PLAYER1.address);
    await expect<Promise<ContractTransaction>>(ownable.connect(PLAYER2).renounceOwnership()).toBeRevertedWith(
      'caller is not the owner',
    );

    await expect<Promise<ContractTransaction>>(ownable.connect(OWNER_MANAGER).renounceOwnership()).toBeRevertedWith(
      'caller is not the owner',
    );
  });
});

describe('transferOwnership', () => {
  it('should set the owner to the new address', async () => {
    const ownable = await createOwnable(PLAYER1.address);
    await ownable.connect(PLAYER1).transferOwnership(PLAYER2.address);
    expect<string>(await ownable.owner()).toEqual(PLAYER2.address);

    await ownable.connect(OWNER_MANAGER).transferOwnership(PLAYER3.address);
    expect<string>(await ownable.owner()).toEqual(PLAYER3.address);
  });

  it('should revert if not the current owner or ownership manager', async () => {
    const ownable = await createOwnable(PLAYER1.address);
    await expect<Promise<ContractTransaction>>(
      ownable.connect(PLAYER2).transferOwnership(PLAYER2.address),
    ).toBeRevertedWith('caller is not the owner or owner manager');
  });
});
