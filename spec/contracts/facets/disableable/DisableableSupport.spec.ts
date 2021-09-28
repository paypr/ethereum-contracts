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

import { buildDiamondFacetCut } from '../../../../src/contracts/core/diamonds';
import { DISABLER } from '../../../helpers/Accounts';
import { createDiamond } from '../../../helpers/DiamondHelper';
import { asTestEnabled, createDisableable, deployTestEnabled } from '../../../helpers/facets/DisableableFacetHelper';

describe('checkEnabled', () => {
  it('should succeed when enabled', async () => {
    const disableable = await createDisableable([buildDiamondFacetCut(await deployTestEnabled())]);

    const enabledChecker = asTestEnabled(disableable);

    await enabledChecker.requireEnabled();
  });

  it('should revert when disabled', async () => {
    const disableable = await createDisableable([buildDiamondFacetCut(await deployTestEnabled())]);

    const enabledChecker = asTestEnabled(disableable);

    await disableable.connect(DISABLER).disable();

    await expect<Promise<void>>(enabledChecker.requireEnabled()).toBeRevertedWith('Contract is disabled');
  });
});

describe('checkEnabledSafe', () => {
  it('should succeed when enabled', async () => {
    const disableable = await createDisableable([buildDiamondFacetCut(await deployTestEnabled())]);

    const enabledChecker = asTestEnabled(disableable);

    await enabledChecker.requireEnabledSafe();
  });

  it('should succeed when not IDisableable', async () => {
    const enabledChecker = asTestEnabled(
      await createDiamond({ additionalCuts: [buildDiamondFacetCut(await deployTestEnabled())] }),
    );

    await enabledChecker.requireEnabledSafe();
  });

  it('should revert when disabled', async () => {
    const disableable = await createDisableable([buildDiamondFacetCut(await deployTestEnabled())]);

    const enabledChecker = asTestEnabled(disableable);

    await disableable.connect(DISABLER).disable();

    await expect<Promise<void>>(enabledChecker.requireEnabledSafe()).toBeRevertedWith('Contract is disabled');
  });
});
