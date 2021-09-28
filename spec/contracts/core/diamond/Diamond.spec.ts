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

import { buildAccessControlAddAdminsInitFunction } from '../../../../src/contracts/access';
import { buildDiamondFacetCut } from '../../../../src/contracts/core/diamonds';
import { IAccessControl__factory } from '../../../../types/contracts';
import { INITIALIZER, PLAYER1 } from '../../../helpers/Accounts';
import {
  ACCESS_CONTROL_INTERFACE_ID,
  ACCESS_DELEGATE_INTERFACE_ID,
  DIAMOND_CUT_INTERFACE_ID,
  DIAMOND_LOUPE_INTERFACE_ID,
  ERC165_INTERFACE_ID,
} from '../../../../src/contracts/erc165InterfaceIds';
import { createDiamond, deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import { deployAccessControlInit } from '../../../helpers/facets/AccessControlFacetHelper';
import { deployDiamondLoupeFacet } from '../../../helpers/facets/DiamondFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import { ROLE1 } from '../../../helpers/RoleIds';

describe('supportsInterface', () => {
  describe('minimal', () => {
    it('should fail to get interface', async () => {
      const diamond = asErc165(await deployDiamond([]));

      expect<Promise<boolean>>(diamond.supportsInterface(ERC165_INTERFACE_ID)).toBeRevertedWith(
        'Diamond: Function does not exist',
      );
    });

    const createBasicDiamond = async () => {
      const erc165Facet = await deployErc165Facet();

      return asErc165(await deployDiamond([buildDiamondFacetCut(erc165Facet)]));
    };

    shouldSupportInterface('ERC165', createBasicDiamond, ERC165_INTERFACE_ID);
  });

  describe('full diamond', () => {
    const create = async () => {
      const diamondLoupeFacet = await deployDiamondLoupeFacet();

      const diamond = await createDiamond({ additionalCuts: [buildDiamondFacetCut(diamondLoupeFacet)] });

      return asErc165(diamond);
    };

    shouldSupportInterface('ERC165', create, ERC165_INTERFACE_ID);
    shouldSupportInterface('AccessControl', create, ACCESS_CONTROL_INTERFACE_ID);
    shouldSupportInterface('AccessDelegate', create, ACCESS_DELEGATE_INTERFACE_ID);
    shouldSupportInterface('DiamondCut', create, DIAMOND_CUT_INTERFACE_ID);
    shouldSupportInterface('DiamondLoupe', create, DIAMOND_LOUPE_INTERFACE_ID);
  });
});

describe('constructor', () => {
  it('should call init function', async () => {
    const accessControlInit = await deployAccessControlInit();

    const diamond = await createDiamond({
      additionalInits: [
        buildAccessControlAddAdminsInitFunction(accessControlInit, [{ role: ROLE1, admins: [PLAYER1.address] }]),
      ],
    });

    const accessControl = IAccessControl__factory.connect(diamond.address, INITIALIZER);

    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER1.address)).toBe(true);
  });
});
