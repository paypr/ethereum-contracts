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

import { ContractTransaction } from 'ethers/lib/ethers';
import { buildAccessControlInitAdminsInitFunction } from '../../../../src/contracts/access';
import {
  buildDiamondFacetCut,
  DiamondFacetCutAction,
  getAllFunctionSelectors,
} from '../../../../src/contracts/diamonds';
import { NO_INTERFACE } from '../../../../src/contracts/erc165';
import { ADMIN_ROLE, DISABLER_ROLE, SUPER_ADMIN_ROLE } from '../../../../src/contracts/roles';
import { INITIALIZER, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { deployDiamond } from '../../../helpers/DiamondHelper';
import {
  asAccessControl,
  deployAccessControlFacet,
  deployAccessControlInit,
} from '../../../helpers/facets/AccessControlFacetHelper';
import { asDisableable, deployDisableableFacet } from '../../../helpers/facets/DisableableFacetHelper';
import { deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';

describe('isInterfaceSupported', () => {
  it('should return true when the interface is supported', async () => {
    // access control checks the Disableable interface during grantRole
    const accessControl = asAccessControl(
      await deployDiamond(
        [
          buildDiamondFacetCut(await deployErc165Facet()),
          buildDiamondFacetCut(await deployAccessControlFacet()),
          buildDiamondFacetCut(await deployDisableableFacet()),
        ],
        buildAccessControlInitAdminsInitFunction(await deployAccessControlInit(), [SUPER_ADMIN_ROLE, DISABLER_ROLE]),
      ),
    );

    // this would succeed whether the disableable interface is implemented or not
    await accessControl.grantRole(ADMIN_ROLE, PLAYER1.address);

    expect<boolean>(await accessControl.hasRole(ADMIN_ROLE, PLAYER1.address)).toBe(true);

    await asDisableable(accessControl, INITIALIZER).disable();

    // this would not fail if the disableable interface isn't implemented
    await expect<Promise<ContractTransaction>>(accessControl.grantRole(ADMIN_ROLE, PLAYER2.address)).toBeRevertedWith(
      'Contract is disabled',
    );

    expect<boolean>(await accessControl.hasRole(ADMIN_ROLE, PLAYER2.address)).toBe(false);
  });

  it('should return false when the interface is not supported', async () => {
    // access control checks the Disableable interface during grantRole
    const disableableFacet = await deployDisableableFacet();
    const accessControl = asAccessControl(
      await deployDiamond(
        [
          buildDiamondFacetCut(await deployErc165Facet()),
          buildDiamondFacetCut(await deployAccessControlFacet()),
          {
            facetAddress: disableableFacet.address,
            functionSelectors: getAllFunctionSelectors(disableableFacet),
            action: DiamondFacetCutAction.Add,
            interfaceId: NO_INTERFACE,
          },
        ],
        buildAccessControlInitAdminsInitFunction(await deployAccessControlInit(), [SUPER_ADMIN_ROLE, DISABLER_ROLE]),
      ),
    );

    // this would succeed whether the disableable interface is implemented or not
    await accessControl.grantRole(ADMIN_ROLE, PLAYER1.address);

    expect<boolean>(await accessControl.hasRole(ADMIN_ROLE, PLAYER1.address)).toBe(true);

    await asDisableable(accessControl, INITIALIZER).disable();

    // this would have failed if the disableable interface was implemented
    await accessControl.grantRole(ADMIN_ROLE, PLAYER2.address);

    expect<boolean>(await accessControl.hasRole(ADMIN_ROLE, PLAYER2.address)).toBe(true);
  });

  it('should fail when the ERC165 interface is not supported', async () => {
    // access control checks the Disableable interface during grantRole
    const accessControl = asAccessControl(
      await deployDiamond(
        [buildDiamondFacetCut(await deployAccessControlFacet()), buildDiamondFacetCut(await deployDisableableFacet())],
        buildAccessControlInitAdminsInitFunction(await deployAccessControlInit(), [SUPER_ADMIN_ROLE, DISABLER_ROLE]),
      ),
    );

    // this would have succeeded whether the disableable interface is implemented or not
    await expect<Promise<ContractTransaction>>(accessControl.grantRole(ADMIN_ROLE, PLAYER1.address)).toBeRevertedWith(
      'Function does not exist',
    );

    expect<boolean>(await accessControl.hasRole(ADMIN_ROLE, PLAYER1.address)).toBe(false);

    await asDisableable(accessControl, INITIALIZER).disable();

    // this would have failed even if the disableable interface was implemented
    await expect<Promise<ContractTransaction>>(accessControl.grantRole(ADMIN_ROLE, PLAYER1.address)).toBeRevertedWith(
      'Function does not exist',
    );

    expect<boolean>(await accessControl.hasRole(ADMIN_ROLE, PLAYER2.address)).toBe(false);
  });
});
