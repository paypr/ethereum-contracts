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

import { buildDiamondFacetCut } from '../../../../src/contracts/diamonds';
import {
  ACCESS_CONTROL_INTERFACE_ID,
  DELEGATING_ACCESS_INTERFACE_ID,
  DIAMOND_CUT_INTERFACE_ID,
  ERC165_INTERFACE_ID,
} from '../../../../src/contracts/erc165InterfaceIds';
import { deployDiamond } from '../../../helpers/DiamondHelper';
import { deployAccessControlFacet } from '../../../helpers/facets/AccessControlFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';

describe('supportsInterface', () => {
  it('should return true for ERC165 interface', async () => {
    const erc165 = asErc165(await deployDiamond([buildDiamondFacetCut(await deployErc165Facet())]));

    expect<boolean>(await erc165.supportsInterface(ERC165_INTERFACE_ID)).toBe(true);
  });

  it('should return true for all supported interfaces', async () => {
    const erc165 = asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployAccessControlFacet()),
      ]),
    );

    expect<boolean>(await erc165.supportsInterface(ERC165_INTERFACE_ID)).toBe(true);
    expect<boolean>(await erc165.supportsInterface(ACCESS_CONTROL_INTERFACE_ID)).toBe(true);
  });

  it('should return false for all unsupported interfaces', async () => {
    const erc165 = asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployAccessControlFacet()),
      ]),
    );

    expect<boolean>(await erc165.supportsInterface(DIAMOND_CUT_INTERFACE_ID)).toBe(false);
    expect<boolean>(await erc165.supportsInterface(DELEGATING_ACCESS_INTERFACE_ID)).toBe(false);
  });
});
