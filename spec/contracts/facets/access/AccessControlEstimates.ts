/*
 * Copyright (c) 2022 The Paypr Company, LLC
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

import { buildAccessControlInitAdminsInitFunction } from '../../../../src/contracts/access';
import { buildOwnableSetOwnerInitFunction } from '../../../../src/contracts/access/ownable';
import { buildDiamondFacetCut, emptyDiamondInitFunction } from '../../../../src/contracts/diamonds';
import { PLAYER1 } from '../../../helpers/Accounts';
import { EstimateTest, singleFunctionFacetEstimate } from '../../../helpers/EstimateHelper';
import {
  deployAccessControlCheckFacet,
  deployAccessControlFacet,
  deployAccessControlInit,
} from '../../../helpers/facets/AccessControlFacetHelper';
import { deployOwnableInit } from '../../../helpers/facets/OwnableFacetHelper';
import { ROLE1, ROLE2 } from '../../../helpers/RoleIds';

export const accessControlEstimateTests: EstimateTest[] = [
  [
    'AccessControlCheckFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployAccessControlCheckFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    singleFunctionFacetEstimate,
  ],
  [
    'AccessControlFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployAccessControlFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    194851,
  ],
  [
    'AccessControlFacet with single role',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployAccessControlFacet())],
      initFunction: buildAccessControlInitAdminsInitFunction(await deployAccessControlInit(), [ROLE1]),
    }),
    225894,
  ],
  [
    'AccessControlFacet with two roles',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployAccessControlFacet())],
      initFunction: buildAccessControlInitAdminsInitFunction(await deployAccessControlInit(), [ROLE1, ROLE2]),
    }),
    251157,
  ],
  [
    'OwnableFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployAccessControlFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    194851,
  ],
  [
    'OwnableFacet with setOwner',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployAccessControlFacet())],
      initFunction: buildOwnableSetOwnerInitFunction(await deployOwnableInit(), PLAYER1.address),
    }),
    223730,
  ],
];
