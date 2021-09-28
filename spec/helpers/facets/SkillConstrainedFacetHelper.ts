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
import { buildDiamondFacetCut } from '../../../src/contracts/diamonds';
import { SkillLevel } from '../../../src/contracts/skills';
import { buildSetRequiredSkillsFunction } from '../../../src/contracts/skills/skillConstrained';
import { SUPER_ADMIN_ROLE } from '../../../src/contracts/roles';
import {
  ISkillConstrained__factory,
  SkillConstrainedFacet,
  SkillConstrainedFacet__factory,
  SkillConstrainedInit,
  SkillConstrainedInit__factory,
  TestSkillConstrainedFacet__factory,
} from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, createDiamond, ExtensibleDiamondOptions } from '../DiamondHelper';

export const asSkillConstrained = (contract: Contract, signer: Signer = INITIALIZER) =>
  ISkillConstrained__factory.connect(contract.address, signer);

export const asTestSkillConstrained = (contract: Contract, signer: Signer = INITIALIZER) =>
  TestSkillConstrainedFacet__factory.connect(contract.address, signer);

export interface CreateConstrainedConsumableOptions extends ExtensibleDiamondOptions {
  skillConstrainedFacet?: SkillConstrainedFacet;
  skillConstrainedInit?: SkillConstrainedInit;
}

export const createSkillConstrained = async (
  requiredSkills: SkillLevel[],
  options: CreateConstrainedConsumableOptions = {},
) => {
  const skillConstrainedFacet = options.skillConstrainedFacet || (await deploySkillConstrainedFacet());
  const skillConstrainedInit = options.skillConstrainedInit || (await deploySkillConstrainedInit());

  return asSkillConstrained(
    await createDiamond(
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [buildDiamondFacetCut(skillConstrainedFacet)],
          additionalRoleAdmins: [{ role: SUPER_ADMIN_ROLE, admins: [INITIALIZER.address] }],
          additionalInits: [buildSetRequiredSkillsFunction(skillConstrainedInit, requiredSkills)],
        },
        options,
      ),
    ),
  );
};

export const createTestSkillConstrained = async (requiredSkills: SkillLevel[]) =>
  asTestSkillConstrained(
    await createSkillConstrained(requiredSkills, {
      additionalCuts: [buildDiamondFacetCut(await deployTestSkillConstrainedFacet())],
    }),
  );

export const deploySkillConstrainedFacet = () => new SkillConstrainedFacet__factory(INITIALIZER).deploy();
export const deploySkillConstrainedInit = () => new SkillConstrainedInit__factory(INITIALIZER).deploy();
export const deployTestSkillConstrainedFacet = () => new TestSkillConstrainedFacet__factory(INITIALIZER).deploy();
