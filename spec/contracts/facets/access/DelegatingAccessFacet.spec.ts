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
import { buildDiamondFacetCut } from '../../../../src/contracts/diamonds';
import { DELEGATING_ACCESS_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { DELEGATE_ADMIN_ROLE, DISABLER_ROLE } from '../../../../src/contracts/roles';
import { IAccessControl } from '../../../../types/contracts';
import { INITIALIZER, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { createDiamond, deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import {
  asAccessCheck,
  asDelegatingAccess,
  asTestCheckRole,
  createAccessControl,
  createDelegatingAccess,
  deployDelegatingAccessFacet,
  deployTestCheckRole,
} from '../../../helpers/facets/AccessControlFacetHelper';
import { asDisableable, deployDisableableFacet } from '../../../helpers/facets/DisableableFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import { ROLE1 } from '../../../helpers/RoleIds';

describe('supportsInterface', () => {
  const createContract = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployDelegatingAccessFacet()),
      ]),
    );

  shouldSupportInterface('DelegatingAccess', createContract, DELEGATING_ACCESS_INTERFACE_ID);
});

describe(`checkRole`, () => {
  const createTestdelegatingAccess = async (accessControl: IAccessControl) =>
    asDelegatingAccess(
      await createDiamond({
        additionalCuts: [buildDiamondFacetCut(await deployTestCheckRole())],
        delegate: asAccessCheck(accessControl),
      }),
    );

  it(`should be callable by user with role`, async () => {
    const accessControl = await createAccessControl();
    await accessControl.grantRole(ROLE1, PLAYER1.address);

    const delegatingAccess = await createTestdelegatingAccess(accessControl);

    await asTestCheckRole(delegatingAccess, PLAYER1).needsRole(ROLE1);
  });

  it('should not be callable by someone without the role', async () => {
    const accessControl = await createAccessControl();
    await accessControl.grantRole(ROLE1, PLAYER1.address);

    const delegatingAccess = await createTestdelegatingAccess(accessControl);

    await expect<Promise<ContractTransaction | void>>(
      asTestCheckRole(delegatingAccess, PLAYER2).needsRole(ROLE1),
    ).toBeRevertedWith(`missing role`);
  });
});

describe('addRoleDelegate', () => {
  it('should add the delegate when called with super admin', async () => {
    const delegatingAccess = await createDelegatingAccess(
      asAccessCheck(await createAccessControl([DELEGATE_ADMIN_ROLE])),
    );
    console.log('created delegating access control:', delegatingAccess.address);
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);
    console.log('created access control:', accessControl.address);

    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(false);
    await delegatingAccess.connect(INITIALIZER).addRoleDelegate(accessControl.address);
    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(true);
  });

  it('should revert when called by someone else', async () => {
    const delegatingAccess = await createDelegatingAccess(
      asAccessCheck(await createAccessControl([DELEGATE_ADMIN_ROLE])),
    );
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);

    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(false);
    await expect<Promise<ContractTransaction>>(
      delegatingAccess.connect(PLAYER1).addRoleDelegate(accessControl.address),
    ).toBeRevertedWith('missing role');
    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(false);
  });

  it('should revert if disabled', async () => {
    const delegatingAccess = await asDelegatingAccess(
      await createDiamond({
        delegate: asAccessCheck(await createAccessControl([DELEGATE_ADMIN_ROLE, DISABLER_ROLE])),
        additionalCuts: [buildDiamondFacetCut(await deployDisableableFacet())],
      }),
    );
    const disableable = asDisableable(delegatingAccess, INITIALIZER);
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);

    await disableable.disable();

    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(false);
    await expect<Promise<ContractTransaction>>(
      delegatingAccess.addRoleDelegate(accessControl.address),
    ).toBeRevertedWith('Contract is disabled');
    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(false);
  });

  it('should not fail when added twice', async () => {
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);
    const delegatingAccess = await createDelegatingAccess(asAccessCheck(accessControl));

    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(true);
    await delegatingAccess.connect(INITIALIZER).addRoleDelegate(accessControl.address);
    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(true);
  });

  it('should emit RoleDelegateAdded event when added', async () => {
    const delegatingAccess = await createDelegatingAccess(
      asAccessCheck(await createAccessControl([DELEGATE_ADMIN_ROLE])),
    );
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);

    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(false);

    await expect<ContractTransaction>(
      await delegatingAccess.connect(INITIALIZER).addRoleDelegate(accessControl.address),
    ).toHaveEmittedWith(delegatingAccess, 'RoleDelegateAdded', [accessControl.address, INITIALIZER.address]);

    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(true);
  });
});

describe('removeRoleDelegate', () => {
  it('should remove the delegate when called with super admin', async () => {
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);
    const delegatingAccess = await createDelegatingAccess(asAccessCheck(accessControl));

    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(true);
    await delegatingAccess.connect(INITIALIZER).removeRoleDelegate(accessControl.address);
    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(false);
  });

  it('should revert when called by someone else', async () => {
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);
    const delegatingAccess = await createDelegatingAccess(asAccessCheck(accessControl));

    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(true);
    await expect<Promise<ContractTransaction>>(
      delegatingAccess.connect(PLAYER1).removeRoleDelegate(accessControl.address),
    ).toBeRevertedWith('missing role');
    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(true);
  });

  it('should revert if disabled', async () => {
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE, DISABLER_ROLE]);
    const delegatingAccess = await asDelegatingAccess(
      await createDiamond({
        delegate: asAccessCheck(accessControl),
        additionalCuts: [buildDiamondFacetCut(await deployDisableableFacet())],
      }),
    );
    const disableable = asDisableable(delegatingAccess, INITIALIZER);

    await disableable.disable();

    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(true);
    await expect<Promise<ContractTransaction>>(
      delegatingAccess.removeRoleDelegate(accessControl.address),
    ).toBeRevertedWith('Contract is disabled');
    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(true);
  });

  it('should not fail if the delegate is not in the list', async () => {
    const delegatingAccess = await createDelegatingAccess(
      asAccessCheck(await createAccessControl([DELEGATE_ADMIN_ROLE])),
    );
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);

    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(false);
    await delegatingAccess.connect(INITIALIZER).removeRoleDelegate(accessControl.address);
    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(false);
  });

  it('should emit RoleDelegateRemoved event when removed', async () => {
    const accessControl = await createAccessControl([DELEGATE_ADMIN_ROLE]);
    const delegatingAccess = await createDelegatingAccess(asAccessCheck(accessControl));

    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(true);

    await expect<ContractTransaction>(
      await delegatingAccess.connect(INITIALIZER).removeRoleDelegate(accessControl.address),
    ).toHaveEmittedWith(delegatingAccess, 'RoleDelegateRemoved', [accessControl.address, INITIALIZER.address]);

    expect<boolean>(await delegatingAccess.isRoleDelegate(accessControl.address)).toBe(false);
  });
});
