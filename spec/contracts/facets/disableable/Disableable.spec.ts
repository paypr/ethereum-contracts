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

import { ContractTransaction } from 'ethers';
import { buildDiamondFacetCut } from '../../../../src/contracts/core/diamonds';
import { DISABLEABLE_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { DISABLER_ROLE } from '../../../../src/contracts/roles';
import { DISABLER, PLAYER1 } from '../../../helpers/Accounts';
import { deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import { asAccessControl } from '../../../helpers/facets/AccessControlFacetHelper';
import { createDisableable, deployDisableableFacet } from '../../../helpers/facets/DisableableFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployDisableableFacet()),
      ]),
    );

  shouldSupportInterface('Disableable', createDiamondForErc165, DISABLEABLE_INTERFACE_ID);
});

describe('enabled', () => {
  it('should be true on create', async () => {
    const disableable = await createDisableable();

    expect<boolean>(await disableable.enabled()).toEqual(true);
  });

  it('should be false after disabling', async () => {
    const disableable = await createDisableable();

    await disableable.connect(DISABLER).disable();

    expect<boolean>(await disableable.enabled()).toEqual(false);
  });
});

describe('disabled', () => {
  it('should be false on create', async () => {
    const disableable = await createDisableable();

    expect<boolean>(await disableable.disabled()).toEqual(false);
  });

  it('should be true after disabling', async () => {
    const disableable = await createDisableable();

    await disableable.connect(DISABLER).disable();

    expect<boolean>(await disableable.disabled()).toEqual(true);
  });
});

describe('disable', () => {
  it('should disable the contract', async () => {
    const disableable = await createDisableable();

    await disableable.connect(DISABLER).disable();

    expect<boolean>(await disableable.enabled()).toEqual(false);
    expect<boolean>(await disableable.disabled()).toEqual(true);

    await disableable.connect(DISABLER).enable();

    await asAccessControl(disableable).grantRole(DISABLER_ROLE, PLAYER1.address);

    await disableable.connect(PLAYER1).disable();

    expect<boolean>(await disableable.enabled()).toEqual(false);
    expect<boolean>(await disableable.disabled()).toEqual(true);
  });

  it('should not error when called twice', async () => {
    const disableable = await createDisableable();

    await disableable.connect(DISABLER).disable();
    await disableable.connect(DISABLER).disable();

    expect<boolean>(await disableable.enabled()).toEqual(false);
    expect<boolean>(await disableable.disabled()).toEqual(true);
  });

  it('should revert when called by user without Disableable role', async () => {
    const disableable = await createDisableable();

    await expect<Promise<ContractTransaction>>(disableable.connect(PLAYER1).disable()).toBeRevertedWith('missing role');

    expect<boolean>(await disableable.enabled()).toEqual(true);
    expect<boolean>(await disableable.disabled()).toEqual(false);
  });

  it('should emit Disabled event when enabled', async () => {
    const disableable = await createDisableable();

    await expect<ContractTransaction>(await disableable.connect(DISABLER).disable()).toHaveEmittedWith(
      disableable,
      'Disabled',
      [DISABLER.address],
    );
  });

  it('should not emit Disabled event when already disabled', async () => {
    const disableable = await createDisableable();

    await disableable.connect(DISABLER).disable();

    await expect<ContractTransaction>(await disableable.connect(DISABLER).disable()).not.toHaveEmitted(
      disableable,
      'Disabled',
    );
  });
});

describe('enable', () => {
  it('should enable the contract', async () => {
    const disableable = await createDisableable();

    await disableable.connect(DISABLER).disable();

    await disableable.connect(DISABLER).enable();

    expect<boolean>(await disableable.enabled()).toEqual(true);
    expect<boolean>(await disableable.disabled()).toEqual(false);

    await asAccessControl(disableable).grantRole(DISABLER_ROLE, PLAYER1.address);

    await disableable.connect(DISABLER).disable();

    await disableable.connect(PLAYER1).enable();

    expect<boolean>(await disableable.enabled()).toEqual(true);
    expect<boolean>(await disableable.disabled()).toEqual(false);
  });

  it('should not error when called twice', async () => {
    const disableable = await createDisableable();

    await disableable.connect(DISABLER).disable();

    await disableable.connect(DISABLER).enable();
    await disableable.connect(DISABLER).enable();

    expect<boolean>(await disableable.enabled()).toEqual(true);
    expect<boolean>(await disableable.disabled()).toEqual(false);
  });

  it('should revert when called by user without Disableable role', async () => {
    const disableable = await createDisableable();

    await disableable.connect(DISABLER).disable();

    await expect<Promise<ContractTransaction>>(disableable.connect(PLAYER1).enable()).toBeRevertedWith('missing role');

    expect<boolean>(await disableable.enabled()).toEqual(false);
    expect<boolean>(await disableable.disabled()).toEqual(true);
  });

  it('should emit Enabled event when disabled', async () => {
    const disableable = await createDisableable();

    await disableable.connect(DISABLER).disable();

    await expect<ContractTransaction>(await disableable.connect(DISABLER).enable()).toHaveEmittedWith(
      disableable,
      'Enabled',
      [DISABLER.address],
    );
  });

  it('should not emit Enabled event when already enabled', async () => {
    const disableable = await createDisableable();

    await expect<ContractTransaction>(await disableable.connect(DISABLER).enable()).not.toHaveEmitted(
      disableable,
      'Enabled',
    );
  });
});
