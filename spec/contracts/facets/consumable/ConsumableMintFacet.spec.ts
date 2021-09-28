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
import { ZERO_ADDRESS } from '../../../../src/contracts/accounts';
import { buildDiamondFacetCut } from '../../../../src/contracts/diamonds';
import { CONSUMABLE_MINT_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { PLAYER1, PLAYER2, PLAYER3 } from '../../../helpers/Accounts';
import { deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import {
  asConsumableMint,
  createConsumable,
  createDisableableConsumable,
  deployConsumableMintFacet,
} from '../../../helpers/facets/ConsumableFacetHelper';
import { asDisableable } from '../../../helpers/facets/DisableableFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployConsumableMintFacet()),
      ]),
    );

  shouldSupportInterface('ConsumableMint', createDiamondForErc165, CONSUMABLE_MINT_INTERFACE_ID);
});

describe('mint', () => {
  it('should mint under normal circumstances', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(0);

    await consumableMint.mint(PLAYER2.address, 100);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(0);

    await consumableMint.mint(PLAYER1.address, 100);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(0);
  });

  it('should set the totalSupply', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(1000);

    await consumableMint.mint(PLAYER2.address, 100);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(1100);

    await consumableMint.mint(PLAYER1.address, 100);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(1200);
  });

  it('should emit Transfer', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await expect<ContractTransaction>(await consumableMint.mint(PLAYER1.address, 100)).toHaveEmittedWith(
      consumable,
      'Transfer',
      [ZERO_ADDRESS, PLAYER1.address, BigNumber.from(100).toString()],
    );

    await expect<ContractTransaction>(await consumableMint.mint(PLAYER2.address, 200)).toHaveEmittedWith(
      consumable,
      'Transfer',
      [ZERO_ADDRESS, PLAYER2.address, BigNumber.from(200).toString()],
    );
  });

  it('should not mint if called by someone without minter role', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await expect<Promise<ContractTransaction>>(
      consumableMint.connect(PLAYER1).mint(PLAYER2.address, 100),
    ).toBeRevertedWith('missing role');

    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
  });

  it('should not transfer if disabled', async () => {
    const consumable = await createDisableableConsumable();

    const consumableMint = asConsumableMint(consumable);

    await asDisableable(consumable).disable();

    await expect<Promise<ContractTransaction>>(consumableMint.mint(PLAYER1.address, 100)).toBeRevertedWith(
      'Contract is disabled',
    );

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
  });
});

describe('burn', () => {
  it('should burn when there is enough to burn', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);
    await consumableMint.mint(PLAYER2.address, 1000);

    await consumableMint.burn(PLAYER1.address, 500);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(500);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(1000);

    await consumableMint.burn(PLAYER2.address, 100);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(500);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(900);

    await consumableMint.burn(PLAYER1.address, 200);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(300);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(900);

    await consumableMint.burn(PLAYER1.address, 300);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(900);
  });

  it('should not burn if there is not enough to burn', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 0);

    await expect<Promise<ContractTransaction>>(consumableMint.burn(PLAYER1.address, 100)).toBeRevertedWith(
      'burn amount exceeds balance',
    );

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);

    await consumableMint.mint(PLAYER1.address, 99);

    await expect<Promise<ContractTransaction>>(consumableMint.burn(PLAYER1.address, 100)).toBeRevertedWith(
      'burn amount exceeds balance',
    );

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(99);
  });

  it('should set the totalSupply', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);
    await consumableMint.mint(PLAYER2.address, 1000);

    await consumableMint.burn(PLAYER1.address, 500);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(1500);

    await consumableMint.burn(PLAYER2.address, 100);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(1400);

    await consumableMint.burn(PLAYER1.address, 200);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(1200);

    await consumableMint.burn(PLAYER2.address, 900);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(300);

    await consumableMint.burn(PLAYER1.address, 300);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(0);
  });

  it('should emit Transfer', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);
    await consumableMint.mint(PLAYER2.address, 1000);

    await expect<ContractTransaction>(await consumableMint.burn(PLAYER1.address, 500)).toHaveEmittedWith(
      consumable,
      'Transfer',
      [PLAYER1.address, ZERO_ADDRESS, BigNumber.from(500).toString()],
    );

    await expect<ContractTransaction>(await consumableMint.burn(PLAYER2.address, 200)).toHaveEmittedWith(
      consumable,
      'Transfer',
      [PLAYER2.address, ZERO_ADDRESS, BigNumber.from(200).toString()],
    );
  });

  it('should not burn if called by someone without minter role', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER2.address, 1000);

    await expect<Promise<ContractTransaction>>(
      consumableMint.connect(PLAYER1).burn(PLAYER2.address, 100),
    ).toBeRevertedWith('missing role');

    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(1000);
  });

  it('should not transfer if disabled', async () => {
    const consumable = await createDisableableConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await asDisableable(consumable).disable();

    await expect<Promise<ContractTransaction>>(consumableMint.burn(PLAYER1.address, 100)).toBeRevertedWith(
      'Contract is disabled',
    );

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
  });
});
