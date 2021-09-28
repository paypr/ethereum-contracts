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

import { Contract, Signer } from 'ethers';
import { buildDiamondFacetCut, DiamondFacetCut } from '../../../src/contracts/diamonds';
import { DISABLER_ROLE, SUPER_ADMIN_ROLE } from '../../../src/contracts/roles';
import { DisableableFacet__factory, IDisableable__factory, TestEnabled__factory } from '../../../types/contracts';
import { DISABLER, INITIALIZER } from '../Accounts';
import { createDiamond, ExtensibleDiamondOptions } from '../DiamondHelper';

export const asDisableable = (contract: Contract, signer: Signer = DISABLER) =>
  IDisableable__factory.connect(contract.address, signer);

export const asTestEnabled = (contract: Contract) => TestEnabled__factory.connect(contract.address, INITIALIZER);

export const createDisableable = async (additionalCuts: DiamondFacetCut[] = []) =>
  asDisableable(
    await createDiamond({
      additionalCuts: [buildDiamondFacetCut(await deployDisableableFacet()), ...additionalCuts],
      additionalRoleAdmins: [
        { role: SUPER_ADMIN_ROLE, admins: [INITIALIZER.address] },
        { role: DISABLER_ROLE, admins: [DISABLER.address] },
      ],
    }),
  );

export const deployDisableableFacet = () => new DisableableFacet__factory(INITIALIZER).deploy();
export const deployTestEnabled = () => new TestEnabled__factory(INITIALIZER).deploy();

export const buildDisableableDiamondAdditions = async (): Promise<ExtensibleDiamondOptions> => ({
  additionalCuts: [buildDiamondFacetCut(await deployDisableableFacet())],
  additionalRoleAdmins: [{ role: DISABLER_ROLE, admins: [DISABLER.address] }],
});
