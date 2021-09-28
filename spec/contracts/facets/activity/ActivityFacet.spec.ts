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
import { ACTIVITY_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import { createActivity, deployActivityFacet } from '../../../helpers/facets/ActivityFacetHelper';
import { asDisableable, buildDisableableDiamondAdditions } from '../../../helpers/facets/DisableableFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployActivityFacet()),
      ]),
    );

  shouldSupportInterface('Activity', createDiamondForErc165, ACTIVITY_INTERFACE_ID);
});

describe('executed', () => {
  it('should return 0 when it has never been executed', async () => {
    const activity = await createActivity();

    expect<BigNumber>(await activity.executed(PLAYER1.address)).toEqBN(0);
    expect<BigNumber>(await activity.executed(PLAYER2.address)).toEqBN(0);
  });

  it('should return 0 when the player has never executed the activity', async () => {
    const activity = await createActivity();

    await activity.connect(PLAYER2).execute([]);

    expect<BigNumber>(await activity.executed(PLAYER1.address)).toEqBN(0);
  });

  it('should return the number of times the player has executed the activity', async () => {
    const activity = await createActivity();

    await activity.connect(PLAYER1).execute([]);
    await activity.connect(PLAYER2).execute([]);
    await activity.connect(PLAYER2).execute([]);

    expect<BigNumber>(await activity.executed(PLAYER1.address)).toEqBN(1);
    expect<BigNumber>(await activity.executed(PLAYER2.address)).toEqBN(2);
  });
});

describe('totalExecuted', () => {
  it('should return 0 when it has never been executed', async () => {
    const activity = await createActivity();

    expect<BigNumber>(await activity.totalExecuted()).toEqBN(0);
  });

  it('should return the number of times the activity has been executed by all players', async () => {
    const activity = await createActivity();

    await activity.connect(PLAYER1).execute([]);

    expect<BigNumber>(await activity.totalExecuted()).toEqBN(1);

    await activity.connect(PLAYER2).execute([]);
    await activity.connect(PLAYER1).execute([]);

    expect<BigNumber>(await activity.totalExecuted()).toEqBN(3);
  });
});

describe('execute', () => {
  it('should not execute if disabled', async () => {
    const activity = await createActivity(await buildDisableableDiamondAdditions());

    await asDisableable(activity).disable();

    await expect<Promise<ContractTransaction>>(activity.connect(PLAYER1).execute([])).toBeRevertedWith(
      'Contract is disabled',
    );
  });

  it('should emit Executed event', async () => {
    const activity = await createActivity();

    await expect<ContractTransaction>(await activity.connect(PLAYER1).execute([])).toHaveEmittedWith(
      activity,
      'Executed',
      [PLAYER1.address],
    );
    await expect<ContractTransaction>(await activity.connect(PLAYER2).execute([])).toHaveEmittedWith(
      activity,
      'Executed',
      [PLAYER2.address],
    );
  });
});
