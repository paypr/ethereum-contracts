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
import {
  ACCESS_DELEGATE_INTERFACE_ID,
  DELEGATING_ACCESS_CONTROL_INTERFACE_ID,
} from '../../../../src/contracts/erc165InterfaceIds';
import { DELEGATE_ADMIN_ROLE, DISABLER_ROLE } from '../../../../src/contracts/roles';
import { IAccessControl } from '../../../../types/contracts';
import { INITIALIZER, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { createDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import {
  asDelegatingAccessControl,
  asTestCheckRole,
  createAccessControl,
  createDelegatingAccessControl,
  deployTestCheckRole,
} from '../../../helpers/facets/AccessControlFacetHelper';
import { asDisableable, deployDisableableFacet } from '../../../helpers/facets/DisableableFacetHelper';
import { asErc165 } from '../../../helpers/facets/ERC165FacetHelper';
import { ROLE1 } from '../../../helpers/RoleIds';

describe('supportsInterface', () => {
  const createContract = async () => asErc165(await createDelegatingAccessControl(await createAccessControl()));

  shouldSupportInterface('DelegatingAccessControl', createContract, DELEGATING_ACCESS_CONTROL_INTERFACE_ID);
  shouldSupportInterface('AccessDelegate', createContract, ACCESS_DELEGATE_INTERFACE_ID);
});

describe(`hasRole`, () => {
  it(`should return true for the user`, async () => {
    const accessControl = await createAccessControl();
    const delegatingAccessControl = await createDelegatingAccessControl(accessControl);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    expect<boolean>(await delegatingAccessControl.hasRole(ROLE1, PLAYER1.address)).toEqual(true);
  });

  it('should return false for someone else', async () => {
    const accessControl = await createAccessControl();
    const delegatingAccessControl = await createDelegatingAccessControl(accessControl);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    expect<boolean>(await delegatingAccessControl.hasRole(ROLE1, PLAYER2.address)).toEqual(false);
  });

  it('should return false for all when not set', async () => {
    const accessControl = await createAccessControl();
    const delegatingAccessControl = await createDelegatingAccessControl(accessControl);

    expect<boolean>(await delegatingAccessControl.hasRole(ROLE1, PLAYER1.address)).toEqual(false);
  });

  it('should return false for the super admin', async () => {
    const accessControl = await createAccessControl();
    const delegatingAccessControl = await createDelegatingAccessControl(accessControl);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    expect<boolean>(await delegatingAccessControl.hasRole(ROLE1, INITIALIZER.address)).toEqual(false);
  });
});

describe(`checkRole`, () => {
  const createTestDelegatingAccessControl = async (accessControl: IAccessControl) =>
    asDelegatingAccessControl(
      await createDiamond({
        additionalCuts: [buildDiamondFacetCut(await deployTestCheckRole())],
        delegate: accessControl,
      }),
    );

  it(`should be callable by user with role`, async () => {
    const accessControl = await createAccessControl();
    await accessControl.grantRole(ROLE1, PLAYER1.address);

    const delegatingAccessControl = await createTestDelegatingAccessControl(accessControl);

    await asTestCheckRole(delegatingAccessControl, PLAYER1).needsRole(ROLE1);
  });

  it('should not be callable by someone without the role', async () => {
    const accessControl = await createAccessControl();
    await accessControl.grantRole(ROLE1, PLAYER1.address);

    const delegatingAccessControl = await createTestDelegatingAccessControl(accessControl);

    await expect<Promise<ContractTransaction | void>>(
      asTestCheckRole(delegatingAccessControl, PLAYER2).needsRole(ROLE1),
    ).toBeRevertedWith(`missing role`);
  });
});

describe('addRoleDelegate', () => {
  it('should add the delegate when called with super admin', async () => {
    const delegatingAccessControl = await createDelegatingAccessControl(
      await createAccessControl([DELEGATE_ADMIN_ROLE]),
    );
    console.log('created delegating access control:', delegatingAccessControl.address);
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);
    console.log('created access control:', accessControl.address);

    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(false);
    await delegatingAccessControl.connect(INITIALIZER).addRoleDelegate(accessControl.address);
    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(true);
  });

  it('should revert when called by someone else', async () => {
    const delegatingAccessControl = await createDelegatingAccessControl(
      await createAccessControl([DELEGATE_ADMIN_ROLE]),
    );
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);

    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(false);
    await expect<Promise<ContractTransaction>>(
      delegatingAccessControl.connect(PLAYER1).addRoleDelegate(accessControl.address),
    ).toBeRevertedWith('missing role');
    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(false);
  });

  it('should revert if disabled', async () => {
    const delegatingAccessControl = await asDelegatingAccessControl(
      await createDiamond({
        delegate: await createAccessControl([DELEGATE_ADMIN_ROLE, DISABLER_ROLE]),
        additionalCuts: [buildDiamondFacetCut(await deployDisableableFacet())],
      }),
    );
    const disableable = asDisableable(delegatingAccessControl, INITIALIZER);
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);

    await disableable.disable();

    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(false);
    await expect<Promise<ContractTransaction>>(
      delegatingAccessControl.addRoleDelegate(accessControl.address),
    ).toBeRevertedWith('Contract is disabled');
    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(false);
  });

  it('should not fail when added twice', async () => {
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);
    const delegatingAccessControl = await createDelegatingAccessControl(accessControl);

    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(true);
    await delegatingAccessControl.connect(INITIALIZER).addRoleDelegate(accessControl.address);
    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(true);
  });

  it('should emit RoleDelegateAdded event when added', async () => {
    const delegatingAccessControl = await createDelegatingAccessControl(
      await createAccessControl([DELEGATE_ADMIN_ROLE]),
    );
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);

    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(false);

    await expect<ContractTransaction>(
      await delegatingAccessControl.connect(INITIALIZER).addRoleDelegate(accessControl.address),
    ).toHaveEmittedWith(delegatingAccessControl, 'RoleDelegateAdded', [accessControl.address, INITIALIZER.address]);

    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(true);
  });
});

describe('removeRoleDelegate', () => {
  it('should remove the delegate when called with super admin', async () => {
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);
    const delegatingAccessControl = await createDelegatingAccessControl(accessControl);

    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(true);
    await delegatingAccessControl.connect(INITIALIZER).removeRoleDelegate(accessControl.address);
    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(false);
  });

  it('should revert when called by someone else', async () => {
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);
    const delegatingAccessControl = await createDelegatingAccessControl(accessControl);

    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(true);
    await expect<Promise<ContractTransaction>>(
      delegatingAccessControl.connect(PLAYER1).removeRoleDelegate(accessControl.address),
    ).toBeRevertedWith('missing role');
    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(true);
  });

  it('should revert if disabled', async () => {
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE, DISABLER_ROLE]);
    const delegatingAccessControl = await asDelegatingAccessControl(
      await createDiamond({
        delegate: accessControl,
        additionalCuts: [buildDiamondFacetCut(await deployDisableableFacet())],
      }),
    );
    const disableable = asDisableable(delegatingAccessControl, INITIALIZER);

    await disableable.disable();

    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(true);
    await expect<Promise<ContractTransaction>>(
      delegatingAccessControl.removeRoleDelegate(accessControl.address),
    ).toBeRevertedWith('Contract is disabled');
    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(true);
  });

  it('should not fail if the delegate is not in the list', async () => {
    const delegatingAccessControl = await createDelegatingAccessControl(
      await createAccessControl([DELEGATE_ADMIN_ROLE]),
    );
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);

    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(false);
    await delegatingAccessControl.connect(INITIALIZER).removeRoleDelegate(accessControl.address);
    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(false);
  });

  it('should emit RoleDelegateRemoved event when removed', async () => {
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);
    const delegatingAccessControl = await createDelegatingAccessControl(accessControl);

    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(true);

    await expect<ContractTransaction>(
      await delegatingAccessControl.connect(INITIALIZER).removeRoleDelegate(accessControl.address),
    ).toHaveEmittedWith(delegatingAccessControl, 'RoleDelegateRemoved', [accessControl.address, INITIALIZER.address]);

    expect<boolean>(await delegatingAccessControl.isRoleDelegate(accessControl.address)).toBe(false);
  });
});
