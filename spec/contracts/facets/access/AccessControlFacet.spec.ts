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
import { ACCESS_CONTROL_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { ADMIN_ROLE, DIAMOND_CUTTER_ROLE, MINTER_ROLE, SUPER_ADMIN_ROLE } from '../../../../src/contracts/roles';
import { INITIALIZER, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { createDiamond, deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import { asAccessControl, deployAccessControlFacet } from '../../../helpers/facets/AccessControlFacetHelper';
import { asDisableable, createDisableable } from '../../../helpers/facets/DisableableFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import { ROLE1, ROLE2 } from '../../../helpers/RoleIds';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () => {
    const erc165Facet = await deployErc165Facet();
    const accessControlFacet = await deployAccessControlFacet();

    return asErc165(await deployDiamond([buildDiamondFacetCut(erc165Facet), buildDiamondFacetCut(accessControlFacet)]));
  };

  shouldSupportInterface('AccessControl', createDiamondForErc165, ACCESS_CONTROL_INTERFACE_ID);
});

describe('hasRole', () => {
  it('should return false for any random role and user', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);

    expect<boolean>(await accessControl.hasRole(SUPER_ADMIN_ROLE, PLAYER1.address)).toBe(false);

    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER1.address)).toBe(false);
    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER1.address)).toBe(false);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER1.address)).toBe(false);
  });

  it('should return true for specific roles and users', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);

    expect<boolean>(await accessControl.hasRole(SUPER_ADMIN_ROLE, INITIALIZER.address)).toBe(true);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER1.address)).toBe(true);
  });
});

describe('getRoleAdmin', () => {
  it('should return SuperAdmin when not explicitly set', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);

    expect<string>(await accessControl.getRoleAdmin(ROLE1)).toEqual(SUPER_ADMIN_ROLE);
    expect<string>(await accessControl.getRoleAdmin(ROLE2)).toEqual(SUPER_ADMIN_ROLE);
    expect<string>(await accessControl.getRoleAdmin(ADMIN_ROLE)).toEqual(SUPER_ADMIN_ROLE);
    expect<string>(await accessControl.getRoleAdmin(MINTER_ROLE)).toEqual(SUPER_ADMIN_ROLE);
    expect<string>(await accessControl.getRoleAdmin(DIAMOND_CUTTER_ROLE)).toEqual(SUPER_ADMIN_ROLE);
  });

  it('should return the correct role when explicitly set', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);

    await accessControl.setRoleAdmin(ROLE1, ADMIN_ROLE);
    await accessControl.setRoleAdmin(ROLE2, MINTER_ROLE);

    expect<string>(await accessControl.getRoleAdmin(ROLE1)).toEqual(ADMIN_ROLE);
    expect<string>(await accessControl.getRoleAdmin(ROLE2)).toEqual(MINTER_ROLE);

    expect<string>(await accessControl.getRoleAdmin(MINTER_ROLE)).toEqual(SUPER_ADMIN_ROLE);
    expect<string>(await accessControl.getRoleAdmin(DIAMOND_CUTTER_ROLE)).toEqual(SUPER_ADMIN_ROLE);
  });
});

describe('grantRole', () => {
  it('should grant the role to only that user', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);

    await accessControl.setRoleAdmin(ROLE2, ROLE1);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER1.address)).toBe(true);
    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER1.address)).toBe(false);
    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER2.address)).toBe(false);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    await accessControl.connect(PLAYER1).grantRole(ROLE2, PLAYER2.address);

    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER1.address)).toBe(true);
    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER1.address)).toBe(false);
    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER2.address)).toBe(true);

    await accessControl.connect(PLAYER1).grantRole(ROLE2, PLAYER2.address);
  });

  it('should emit RoleGranted event', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);

    await accessControl.setRoleAdmin(ROLE2, ROLE1);

    await expect<ContractTransaction>(await accessControl.grantRole(ROLE1, PLAYER1.address)).toHaveEmittedWith(
      accessControl,
      'RoleGranted',
      [ROLE1, PLAYER1.address, INITIALIZER.address],
    );

    await expect<ContractTransaction>(await accessControl.grantRole(ROLE1, PLAYER1.address)).not.toHaveEmitted(
      accessControl,
      'RoleGranted',
    );

    await expect<ContractTransaction>(
      await accessControl.connect(PLAYER1).grantRole(ROLE2, PLAYER2.address),
    ).toHaveEmittedWith(accessControl, 'RoleGranted', [ROLE2, PLAYER2.address, PLAYER1.address]);

    await expect<ContractTransaction>(
      await accessControl.connect(PLAYER1).grantRole(ROLE2, PLAYER2.address),
    ).not.toHaveEmitted(accessControl, 'RoleGranted');
  });

  it('should revert if not called by the role admin', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);

    await accessControl.setRoleAdmin(ROLE2, ROLE1);
    await accessControl.grantRole(ROLE1, PLAYER1.address);

    await expect<Promise<ContractTransaction>>(
      accessControl.connect(PLAYER1).grantRole(ROLE1, PLAYER2.address),
    ).toBeRevertedWith('missing role');

    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER2.address)).toBe(false);

    await expect<Promise<ContractTransaction>>(
      accessControl.connect(INITIALIZER).grantRole(ROLE2, PLAYER2.address),
    ).toBeRevertedWith('missing role');

    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER2.address)).toBe(false);
  });

  it('should revert if disabled', async () => {
    const diamond = await createDisableable();
    const disableable = asDisableable(diamond);
    const accessControl = asAccessControl(diamond);

    await disableable.disable();

    await expect<Promise<ContractTransaction>>(accessControl.grantRole(ROLE1, PLAYER1.address)).toBeRevertedWith(
      'Contract is disabled',
    );

    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER1.address)).toBe(false);
  });
});

describe('revokeRole', () => {
  it('should remove the role from only that user', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);

    await accessControl.grantRole(ROLE1, PLAYER1.address);
    await accessControl.grantRole(ROLE2, PLAYER2.address);

    await accessControl.setRoleAdmin(ROLE2, ROLE1);

    await accessControl.connect(PLAYER1).revokeRole(ROLE2, PLAYER2.address);

    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER1.address)).toBe(true);
    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER1.address)).toBe(false);
    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER2.address)).toBe(false);

    await accessControl.connect(PLAYER1).revokeRole(ROLE2, PLAYER2.address);

    await accessControl.revokeRole(ROLE1, PLAYER1.address);

    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER1.address)).toBe(false);
    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER1.address)).toBe(false);
    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER2.address)).toBe(false);

    await accessControl.revokeRole(ROLE1, PLAYER1.address);
  });

  it('should emit RoleRevoked event', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);

    await accessControl.grantRole(ROLE1, PLAYER1.address);
    await accessControl.grantRole(ROLE2, PLAYER2.address);

    await accessControl.setRoleAdmin(ROLE2, ROLE1);

    await expect<ContractTransaction>(
      await accessControl.connect(PLAYER1).revokeRole(ROLE2, PLAYER2.address),
    ).toHaveEmittedWith(accessControl, 'RoleRevoked', [ROLE2, PLAYER2.address, PLAYER1.address]);

    await expect<ContractTransaction>(
      await accessControl.connect(PLAYER1).revokeRole(ROLE2, PLAYER2.address),
    ).not.toHaveEmitted(accessControl, 'RoleRevoked');

    await expect<ContractTransaction>(await accessControl.revokeRole(ROLE1, PLAYER1.address)).toHaveEmittedWith(
      accessControl,
      'RoleRevoked',
      [ROLE1, PLAYER1.address, INITIALIZER.address],
    );

    await expect<ContractTransaction>(await accessControl.revokeRole(ROLE1, PLAYER1.address)).not.toHaveEmitted(
      accessControl,
      'RoleRevoked',
    );
  });

  it('should revert if not called by the role admin', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);

    await accessControl.grantRole(ROLE1, PLAYER1.address);
    await accessControl.grantRole(ROLE1, PLAYER2.address);
    await accessControl.grantRole(ROLE2, PLAYER1.address);
    await accessControl.grantRole(ROLE2, PLAYER2.address);

    await accessControl.setRoleAdmin(ROLE2, ROLE1);

    await expect<Promise<ContractTransaction>>(
      accessControl.connect(PLAYER1).revokeRole(ROLE1, PLAYER2.address),
    ).toBeRevertedWith('missing role');

    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER2.address)).toBe(true);

    await expect<Promise<ContractTransaction>>(
      accessControl.connect(INITIALIZER).grantRole(ROLE2, PLAYER2.address),
    ).toBeRevertedWith('missing role');

    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER2.address)).toBe(true);
  });

  it('should revert if disabled', async () => {
    const diamond = await createDisableable();
    const disableable = asDisableable(diamond);
    const accessControl = asAccessControl(diamond);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    await disableable.disable();

    await expect<Promise<ContractTransaction>>(accessControl.revokeRole(ROLE1, PLAYER1.address)).toBeRevertedWith(
      'Contract is disabled',
    );

    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER1.address)).toBe(true);
  });
});

describe('renounceRole', () => {
  it('should remove the role from only the calling user', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);

    await accessControl.grantRole(ROLE1, PLAYER1.address);
    await accessControl.grantRole(ROLE2, PLAYER2.address);

    await accessControl.setRoleAdmin(ROLE2, ROLE1);

    await accessControl.connect(PLAYER2).renounceRole(ROLE2);

    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER1.address)).toBe(true);
    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER1.address)).toBe(false);
    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER2.address)).toBe(false);

    await accessControl.connect(PLAYER2).renounceRole(ROLE2);

    await accessControl.connect(PLAYER1).renounceRole(ROLE1);

    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER1.address)).toBe(false);
    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER1.address)).toBe(false);
    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER2.address)).toBe(false);
    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER2.address)).toBe(false);

    await accessControl.connect(PLAYER1).renounceRole(ROLE1);
  });

  it('should emit GrantRevoked event', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);

    await accessControl.grantRole(ROLE1, PLAYER1.address);
    await accessControl.grantRole(ROLE2, PLAYER2.address);

    await accessControl.setRoleAdmin(ROLE2, ROLE1);

    await expect<ContractTransaction>(await accessControl.connect(PLAYER2).renounceRole(ROLE2)).toHaveEmittedWith(
      accessControl,
      'RoleRevoked',
      [ROLE2, PLAYER2.address, PLAYER2.address],
    );

    await expect<ContractTransaction>(await accessControl.connect(PLAYER2).renounceRole(ROLE2)).not.toHaveEmitted(
      accessControl,
      'RoleRevoked',
    );

    await expect<ContractTransaction>(await accessControl.connect(PLAYER1).renounceRole(ROLE1)).toHaveEmittedWith(
      accessControl,
      'RoleRevoked',
      [ROLE1, PLAYER1.address, PLAYER1.address],
    );

    await expect<ContractTransaction>(await accessControl.connect(PLAYER1).renounceRole(ROLE1)).not.toHaveEmitted(
      accessControl,
      'RoleRevoked',
    );
  });

  it('should revert if disabled', async () => {
    const diamond = await createDisableable();
    const disableable = asDisableable(diamond);
    const accessControl = asAccessControl(diamond);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    await disableable.disable();

    await expect<Promise<ContractTransaction>>(accessControl.connect(PLAYER1).renounceRole(ROLE1)).toBeRevertedWith(
      'Contract is disabled',
    );

    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER1.address)).toBe(true);
  });
});

describe('setRoleAdmin', () => {
  it('should set only that role', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);

    await accessControl.setRoleAdmin(ROLE1, ADMIN_ROLE);

    expect<string>(await accessControl.getRoleAdmin(ROLE1)).toEqual(ADMIN_ROLE);
    expect<string>(await accessControl.getRoleAdmin(ROLE2)).toEqual(SUPER_ADMIN_ROLE);
    expect<string>(await accessControl.getRoleAdmin(MINTER_ROLE)).toEqual(SUPER_ADMIN_ROLE);
    expect<string>(await accessControl.getRoleAdmin(DIAMOND_CUTTER_ROLE)).toEqual(SUPER_ADMIN_ROLE);

    await accessControl.setRoleAdmin(ROLE2, MINTER_ROLE);

    expect<string>(await accessControl.getRoleAdmin(ROLE1)).toEqual(ADMIN_ROLE);
    expect<string>(await accessControl.getRoleAdmin(ROLE2)).toEqual(MINTER_ROLE);
    expect<string>(await accessControl.getRoleAdmin(MINTER_ROLE)).toEqual(SUPER_ADMIN_ROLE);
    expect<string>(await accessControl.getRoleAdmin(DIAMOND_CUTTER_ROLE)).toEqual(SUPER_ADMIN_ROLE);
  });

  it('should emit RoleAdminChanged event', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);

    await expect<ContractTransaction>(await accessControl.setRoleAdmin(ROLE1, ADMIN_ROLE)).toHaveEmittedWith(
      accessControl,
      'RoleAdminChanged',
      [ROLE1, SUPER_ADMIN_ROLE, ADMIN_ROLE, INITIALIZER.address],
    );

    await accessControl.grantRole(ADMIN_ROLE, INITIALIZER.address);

    await expect<ContractTransaction>(await accessControl.setRoleAdmin(ROLE1, MINTER_ROLE)).toHaveEmittedWith(
      accessControl,
      'RoleAdminChanged',
      [ROLE1, ADMIN_ROLE, MINTER_ROLE, INITIALIZER.address],
    );

    await expect<ContractTransaction>(await accessControl.setRoleAdmin(ROLE2, MINTER_ROLE)).toHaveEmittedWith(
      accessControl,
      'RoleAdminChanged',
      [ROLE2, SUPER_ADMIN_ROLE, MINTER_ROLE, INITIALIZER.address],
    );

    await accessControl.grantRole(MINTER_ROLE, INITIALIZER.address);

    await expect<ContractTransaction>(await accessControl.setRoleAdmin(ROLE2, ADMIN_ROLE)).toHaveEmittedWith(
      accessControl,
      'RoleAdminChanged',
      [ROLE2, MINTER_ROLE, ADMIN_ROLE, INITIALIZER.address],
    );
  });

  it('should revert if not called by the role admin', async () => {
    const diamond = await createDiamond();
    const accessControl = asAccessControl(diamond);

    await accessControl.grantRole(ROLE1, PLAYER1.address);

    await accessControl.setRoleAdmin(ROLE2, ROLE1);

    await expect<Promise<ContractTransaction>>(
      accessControl.connect(PLAYER1).setRoleAdmin(ROLE1, MINTER_ROLE),
    ).toBeRevertedWith('missing role');

    expect<string>(await accessControl.getRoleAdmin(ROLE1)).toEqual(SUPER_ADMIN_ROLE);

    await expect<Promise<ContractTransaction>>(
      accessControl.connect(INITIALIZER).setRoleAdmin(ROLE2, MINTER_ROLE),
    ).toBeRevertedWith('missing role');

    expect<string>(await accessControl.getRoleAdmin(ROLE2)).toEqual(ROLE1);
  });

  it('should revert if disabled', async () => {
    const diamond = await await createDisableable();
    const disableable = asDisableable(diamond);
    const accessControl = asAccessControl(diamond);

    await disableable.disable();

    await expect<Promise<ContractTransaction>>(accessControl.setRoleAdmin(ROLE1, MINTER_ROLE)).toBeRevertedWith(
      'Contract is disabled',
    );

    expect<string>(await accessControl.getRoleAdmin(ROLE1)).toEqual(SUPER_ADMIN_ROLE);
  });
});
