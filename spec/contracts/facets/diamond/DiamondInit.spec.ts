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
import { buildDiamondFacetCut, buildDiamondInitFunction } from '../../../../src/contracts/diamonds';
import { IAccessControl__factory } from '../../../../types/contracts';
import { INITIALIZER, PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { createDiamond } from '../../../helpers/DiamondHelper';
import { deployAccessControlInit } from '../../../helpers/facets/AccessControlFacetHelper';
import { asDiamondCut, deployDiamondInit, deployDiamondLoupeFacet } from '../../../helpers/facets/DiamondFacetHelper';
import { ROLE1, ROLE2 } from '../../../helpers/RoleIds';

describe('initializeDiamond', () => {
  it('should call all init functions', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();
    const accessControlInit = await deployAccessControlInit();
    const diamondInit = await deployDiamondInit();

    const diamond = await createDiamond();

    const init1 = buildAccessControlAddAdminsInitFunction(accessControlInit, [
      { role: ROLE1, members: [PLAYER1.address] },
    ]);
    const init2 = buildAccessControlAddAdminsInitFunction(accessControlInit, [
      { role: ROLE2, members: [PLAYER2.address] },
    ]);

    await asDiamondCut(diamond).diamondCut(
      [buildDiamondFacetCut(loupeFacet)],
      buildDiamondInitFunction(diamondInit, [init1, init2]),
    );

    const accessControl = IAccessControl__factory.connect(diamond.address, INITIALIZER);

    expect<boolean>(await accessControl.hasRole(ROLE1, PLAYER1.address)).toBe(true);
    expect<boolean>(await accessControl.hasRole(ROLE2, PLAYER2.address)).toBe(true);
  });
});
