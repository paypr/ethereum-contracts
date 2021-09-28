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
import { buildDiamondFacetCut } from '../../../../src/contracts/core/diamonds';
import { CONSUMABLE_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { PLAYER1, PLAYER2, PLAYER3 } from '../../../helpers/Accounts';
import { deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import {
  asConsumableMint,
  createConsumable,
  createDisableableConsumable,
  deployConsumableFacet,
} from '../../../helpers/facets/ConsumableFacetHelper';
import { asDisableable } from '../../../helpers/facets/DisableableFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployConsumableFacet()),
      ]),
    );

  shouldSupportInterface('Consumable', createDiamondForErc165, CONSUMABLE_INTERFACE_ID);
});

describe('decimals', () => {
  it('should return 18', async () => {
    const consumable = await createConsumable();

    expect<number>(await consumable.decimals()).toEqual(18);
  });
});

describe('totalSupply', () => {
  it('should return 0 when no accounts with a balance', async () => {
    const consumable = await createConsumable();

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(0);
  });

  it('should return the correct number when accounts have a balance', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(1000);

    await consumableMint.mint(PLAYER2.address, 100);

    expect<BigNumber>(await consumable.totalSupply()).toEqBN(1100);
  });
});

describe('balanceOf', () => {
  it('should return 0 when no accounts with a balance', async () => {
    const consumable = await createConsumable();

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
  });

  it('should return 0 for an account with no balance', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER2.address, 1000);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
  });

  it('should return 0 for an account with only an allowance', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER2.address, 1000);

    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 500);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
  });

  it('should return the correct balance for an account with a balance', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);
    await consumableMint.mint(PLAYER2.address, 2000);

    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 500);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
  });
});

describe('myBalance', () => {
  it('should return 0 when no accounts with a balance', async () => {
    const consumable = await createConsumable();

    expect<BigNumber>(await consumable.connect(PLAYER1).myBalance()).toEqBN(0);
  });

  it('should return 0 for an account with no balance', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER2.address, 1000);

    expect<BigNumber>(await consumable.connect(PLAYER1).myBalance()).toEqBN(0);
  });

  it('should return 0 for an account with only an allowance', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER2.address, 1000);

    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 500);

    expect<BigNumber>(await consumable.connect(PLAYER1).myBalance()).toEqBN(0);
  });

  it('should return the correct balance for an account with a balance', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);
    await consumableMint.mint(PLAYER2.address, 2000);

    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 500);

    expect<BigNumber>(await consumable.connect(PLAYER1).myBalance()).toEqBN(1000);
  });
});

describe('transfer', () => {
  it('should transfer when there are enough tokens', async () => {
    const consumable = await createConsumable();

    await asConsumableMint(consumable).mint(PLAYER1.address, 1000);

    await consumable.connect(PLAYER1).transfer(PLAYER2.address, 100);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(100);
  });

  it('should emit Transfer', async () => {
    const consumable = await createConsumable();

    await asConsumableMint(consumable).mint(PLAYER1.address, 1000);

    await expect<ContractTransaction>(
      await consumable.connect(PLAYER1).transfer(PLAYER2.address, 100),
    ).toHaveEmittedWith(consumable, 'Transfer', [PLAYER1.address, PLAYER2.address, BigNumber.from(100).toString()]);
  });

  it('should not transfer if not enough consumables', async () => {
    const consumable = await createConsumable();

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).transfer(PLAYER2.address, 100),
    ).toBeRevertedWith('transfer amount exceeds balance');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);

    await asConsumableMint(consumable).mint(PLAYER1.address, 99);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).transfer(PLAYER2.address, 100),
    ).toBeRevertedWith('transfer amount exceeds balance');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(99);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
  });

  it('should not transfer if disabled', async () => {
    const consumable = await createDisableableConsumable();

    await asConsumableMint(consumable).mint(PLAYER1.address, 1000);

    await asDisableable(consumable).disable();

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).transfer(PLAYER2.address, 100),
    ).toBeRevertedWith('Contract is disabled');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
  });
});

describe('allowance', () => {
  it('should return 0 when no accounts with an allowance', async () => {
    const consumable = await createConsumable();

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(0);
  });

  it('should return 0 for an account with no allowance', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER2.address, 1000);

    await consumable.connect(PLAYER2).increaseAllowance(PLAYER3.address, 500);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(0);
  });

  it('should return 0 for an account with no allowance from the player', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER2.address, 1000);

    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 500);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER3.address)).toEqBN(0);
  });

  it('should return 0 for an account with only a balance', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 500);

    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER1.address)).toEqBN(0);
  });

  it('should return the correct balance for an account with an allowance', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);
    await consumableMint.mint(PLAYER2.address, 2000);
    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 500);
    await consumable.connect(PLAYER2).increaseAllowance(PLAYER3.address, 1000);

    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER1.address)).toEqBN(500);
  });
});

describe('myAllowance', () => {
  it('should return 0 when no accounts with an allowance', async () => {
    const consumable = await createConsumable();

    expect<BigNumber>(await consumable.connect(PLAYER1).myAllowance(PLAYER2.address)).toEqBN(0);
  });

  it('should return 0 for an account with no allowance', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER2.address, 1000);

    await consumable.connect(PLAYER2).increaseAllowance(PLAYER3.address, 500);

    expect<BigNumber>(await consumable.connect(PLAYER1).myAllowance(PLAYER2.address)).toEqBN(0);
  });

  it('should return 0 for an account with no allowance from the player', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER2.address, 1000);

    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 500);

    expect<BigNumber>(await consumable.connect(PLAYER1).myAllowance(PLAYER3.address)).toEqBN(0);
  });

  it('should return 0 for an account with only a balance', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 500);

    expect<BigNumber>(await consumable.connect(PLAYER1).myAllowance(PLAYER2.address)).toEqBN(0);
  });

  it('should return the correct balance for an account with an allowance', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);
    await consumableMint.mint(PLAYER2.address, 2000);
    await consumable.connect(PLAYER2).increaseAllowance(PLAYER1.address, 500);
    await consumable.connect(PLAYER2).increaseAllowance(PLAYER3.address, 1000);

    expect<BigNumber>(await consumable.connect(PLAYER1).myAllowance(PLAYER2.address)).toEqBN(500);
  });
});

describe('approve', () => {
  it('should set the allowance', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);
    await consumableMint.mint(PLAYER2.address, 1000);

    await consumable.connect(PLAYER1).approve(PLAYER2.address, 500);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(0);

    await consumable.connect(PLAYER2).approve(PLAYER3.address, 100);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(100);

    await consumable.connect(PLAYER1).approve(PLAYER2.address, 200);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(200);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(100);
  });

  it('should set the allowance even when there is no balance', async () => {
    const consumable = await createConsumable();

    await consumable.connect(PLAYER1).approve(PLAYER2.address, 500);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(0);

    await consumable.connect(PLAYER2).approve(PLAYER3.address, 100);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(100);

    await consumable.connect(PLAYER1).approve(PLAYER2.address, 200);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(200);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(100);
  });

  it('should emit Approval', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await expect<ContractTransaction>(
      await consumable.connect(PLAYER1).approve(PLAYER2.address, 500),
    ).toHaveEmittedWith(consumable, 'Approval', [PLAYER1.address, PLAYER2.address, BigNumber.from(500).toString()]);

    await expect<ContractTransaction>(
      await consumable.connect(PLAYER1).approve(PLAYER2.address, 200),
    ).toHaveEmittedWith(consumable, 'Approval', [PLAYER1.address, PLAYER2.address, BigNumber.from(200).toString()]);
  });

  it('should not set allowance if disabled', async () => {
    const consumable = await createDisableableConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await asDisableable(consumable).disable();

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).approve(PLAYER2.address, 100),
    ).toBeRevertedWith('Contract is disabled');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(0);
  });
});

describe('transferFrom', () => {
  it('should transfer when there are enough approved tokens', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 200);

    await consumable.connect(PLAYER2).transferFrom(PLAYER1.address, PLAYER2.address, 100);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(900);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(100);
    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(100);

    await consumable.connect(PLAYER2).transferFrom(PLAYER1.address, PLAYER3.address, 100);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(800);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(100);
    expect<BigNumber>(await consumable.balanceOf(PLAYER3.address)).toEqBN(100);
    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(0);
  });

  it('should emit Transfer', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 200);

    await expect<ContractTransaction>(
      await consumable.connect(PLAYER2).transferFrom(PLAYER1.address, PLAYER2.address, 100),
    ).toHaveEmittedWith(consumable, 'Transfer', [PLAYER1.address, PLAYER2.address, BigNumber.from(100).toString()]);

    await expect<ContractTransaction>(
      await consumable.connect(PLAYER2).transferFrom(PLAYER1.address, PLAYER3.address, 100),
    ).toHaveEmittedWith(consumable, 'Transfer', [PLAYER1.address, PLAYER3.address, BigNumber.from(100).toString()]);
  });

  it('should not transfer if not enough consumables', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER2).transferFrom(PLAYER1.address, PLAYER2.address, 100),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(0);

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);

    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 99);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER2).transferFrom(PLAYER1.address, PLAYER2.address, 100),
    ).toBeRevertedWith('transfer amount exceeds allowance');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(99);
  });

  it('should not transfer if disabled', async () => {
    const consumable = await createDisableableConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 100);

    await asDisableable(consumable).disable();

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER2).transferFrom(PLAYER1.address, PLAYER2.address, 100),
    ).toBeRevertedWith('Contract is disabled');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(100);
  });
});

describe('increaseAllowance', () => {
  it('should set the allowance', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);
    await consumableMint.mint(PLAYER2.address, 1000);

    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 500);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(0);

    await consumable.connect(PLAYER2).increaseAllowance(PLAYER3.address, 100);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(100);

    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 200);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(700);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(100);
  });

  it('should set the allowance even when there is no balance', async () => {
    const consumable = await createConsumable();

    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 500);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(0);

    await consumable.connect(PLAYER2).increaseAllowance(PLAYER3.address, 100);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(100);

    await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 200);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(700);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(100);
  });

  it('should emit Approval', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await expect<ContractTransaction>(
      await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 500),
    ).toHaveEmittedWith(consumable, 'Approval', [PLAYER1.address, PLAYER2.address, BigNumber.from(500).toString()]);

    await expect<ContractTransaction>(
      await consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 200),
    ).toHaveEmittedWith(consumable, 'Approval', [PLAYER1.address, PLAYER2.address, BigNumber.from(700).toString()]);
  });

  it('should not set allowance if disabled', async () => {
    const consumable = await createDisableableConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await asDisableable(consumable).disable();

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).increaseAllowance(PLAYER2.address, 100),
    ).toBeRevertedWith('Contract is disabled');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(0);
  });
});

describe('decreaseAllowance', () => {
  it('should set the allowance', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 2000);
    await consumableMint.mint(PLAYER2.address, 2000);

    await consumable.connect(PLAYER1).approve(PLAYER2.address, 1000);
    await consumable.connect(PLAYER2).approve(PLAYER3.address, 1000);

    await consumable.connect(PLAYER1).decreaseAllowance(PLAYER2.address, 500);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(1000);

    await consumable.connect(PLAYER2).decreaseAllowance(PLAYER3.address, 100);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(900);

    await consumable.connect(PLAYER1).decreaseAllowance(PLAYER2.address, 200);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(300);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(900);

    await consumable.connect(PLAYER1).decreaseAllowance(PLAYER2.address, 300);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(900);
  });

  it('should set the allowance even when there is no balance', async () => {
    const consumable = await createConsumable();

    await consumable.connect(PLAYER1).approve(PLAYER2.address, 1000);
    await consumable.connect(PLAYER2).approve(PLAYER3.address, 1000);

    await consumable.connect(PLAYER1).decreaseAllowance(PLAYER2.address, 500);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(1000);

    await consumable.connect(PLAYER2).decreaseAllowance(PLAYER3.address, 100);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(500);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(900);

    await consumable.connect(PLAYER1).decreaseAllowance(PLAYER2.address, 200);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(300);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(900);

    await consumable.connect(PLAYER1).decreaseAllowance(PLAYER2.address, 300);

    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.allowance(PLAYER2.address, PLAYER3.address)).toEqBN(900);
  });

  it('should emit Approval', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await consumable.connect(PLAYER1).approve(PLAYER2.address, 1000);

    await expect<ContractTransaction>(
      await consumable.connect(PLAYER1).decreaseAllowance(PLAYER2.address, 500),
    ).toHaveEmittedWith(consumable, 'Approval', [PLAYER1.address, PLAYER2.address, BigNumber.from(500).toString()]);

    await expect<ContractTransaction>(
      await consumable.connect(PLAYER1).decreaseAllowance(PLAYER2.address, 200),
    ).toHaveEmittedWith(consumable, 'Approval', [PLAYER1.address, PLAYER2.address, BigNumber.from(300).toString()]);
  });

  it('should not set allowance if would be below zero', async () => {
    const consumable = await createConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await consumable.connect(PLAYER1).approve(PLAYER2.address, 0);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).decreaseAllowance(PLAYER2.address, 100),
    ).toBeRevertedWith('decreased allowance below zero');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(0);

    await consumable.connect(PLAYER1).approve(PLAYER2.address, 99);

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).decreaseAllowance(PLAYER2.address, 100),
    ).toBeRevertedWith('decreased allowance below zero');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(99);
  });

  it('should not set allowance if disabled', async () => {
    const consumable = await createDisableableConsumable();

    const consumableMint = asConsumableMint(consumable);

    await consumableMint.mint(PLAYER1.address, 1000);

    await consumable.connect(PLAYER1).approve(PLAYER2.address, 1000);

    await asDisableable(consumable).disable();

    await expect<Promise<ContractTransaction>>(
      consumable.connect(PLAYER1).decreaseAllowance(PLAYER2.address, 100),
    ).toBeRevertedWith('Contract is disabled');

    expect<BigNumber>(await consumable.balanceOf(PLAYER1.address)).toEqBN(1000);
    expect<BigNumber>(await consumable.balanceOf(PLAYER2.address)).toEqBN(0);
    expect<BigNumber>(await consumable.allowance(PLAYER1.address, PLAYER2.address)).toEqBN(1000);
  });
});
