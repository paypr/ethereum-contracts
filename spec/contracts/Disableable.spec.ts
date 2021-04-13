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
import { TestDisableable__factory } from '../../types/contracts';
import { INITIALIZER } from '../helpers/Accounts';

const deployDisableableContract = () => new TestDisableable__factory(INITIALIZER).deploy();

const createDisableable = async () => deployDisableableContract();

describe('enabled', () => {
  it('should be true on create', async () => {
    const disableable = await createDisableable();

    expect<boolean>(await disableable.enabled()).toEqual(true);
  });

  it('should be false after disabling', async () => {
    const disableable = await createDisableable();

    await disableable.disable();

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

    await disableable.disable();

    expect<boolean>(await disableable.disabled()).toEqual(true);
  });
});

describe('disable', () => {
  it('should disable the contract', async () => {
    const disableable = await createDisableable();

    await disableable.disable();

    expect<boolean>(await disableable.enabled()).toEqual(false);
    expect<boolean>(await disableable.disabled()).toEqual(true);
  });

  it('should not error when called twice', async () => {
    const disableable = await createDisableable();

    await disableable.disable();
    await disableable.disable();

    expect<boolean>(await disableable.enabled()).toEqual(false);
    expect<boolean>(await disableable.disabled()).toEqual(true);
  });

  it('should emit Disabled event when enabled', async () => {
    const disableable = await createDisableable();

    await expect<ContractTransaction>(await disableable.disable()).toHaveEmittedWith(disableable, 'Disabled', []);
  });

  it('should not emit Disabled event when already disabled', async () => {
    const disableable = await createDisableable();

    await disableable.disable();

    await expect<ContractTransaction>(await disableable.disable()).not.toHaveEmitted(disableable, 'Disabled');
  });
});

describe('enable', () => {
  it('should enable the contract', async () => {
    const disableable = await createDisableable();

    await disableable.disable();
    await disableable.enable();

    expect<boolean>(await disableable.enabled()).toEqual(true);
    expect<boolean>(await disableable.disabled()).toEqual(false);
  });

  it('should not error when called twice', async () => {
    const disableable = await createDisableable();

    await disableable.enable();
    await disableable.enable();

    expect<boolean>(await disableable.enabled()).toEqual(true);
    expect<boolean>(await disableable.disabled()).toEqual(false);
  });

  it('should emit Enabled event when disabled', async () => {
    const disableable = await createDisableable();

    await disableable.disable();

    await expect<ContractTransaction>(await disableable.enable()).toHaveEmittedWith(disableable, 'Enabled', []);
  });

  it('should not emit Enabled event when already enabled', async () => {
    const disableable = await createDisableable();

    await expect<ContractTransaction>(await disableable.enable()).not.toHaveEmitted(disableable, 'Enabled');
  });
});

describe('onlyEnabled', () => {
  it('should not revert when enabled', async () => {
    const disableable = await createDisableable();

    await disableable.requiresEnabled();

    await disableable.disable();
    await disableable.enable();

    await disableable.requiresEnabled();
  });

  it('should revert when disabled', async () => {
    const disableable = await createDisableable();

    await disableable.disable();

    await expect<Promise<void>>(disableable.requiresEnabled()).toBeRevertedWith('Contract is disabled');

    await disableable.enable();
    await disableable.disable();

    await expect<Promise<void>>(disableable.requiresEnabled()).toBeRevertedWith('Contract is disabled');
  });
});
