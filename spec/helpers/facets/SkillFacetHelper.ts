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
import { buildDiamondFacetCut } from '../../../src/contracts/core/diamonds';
import { SkillLevel, SkillLevelBN } from '../../../src/contracts/skills';
import { SUPER_ADMIN_ROLE } from '../../../src/contracts/roles';
import {
  ISkill__factory,
  ISkillSelfAcquisition__factory,
  SkillFacet__factory,
  SkillSelfAcquisitionFacet__factory,
  TestSkillFacet__factory,
} from '../../../types/contracts';
import { INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, createDiamond, ExtensibleDiamondOptions } from '../DiamondHelper';

export const asSkill = (contract: Contract, signer: Signer = INITIALIZER) =>
  ISkill__factory.connect(contract.address, signer);

export const asSelfAcquiringSkill = (contract: Contract, signer: Signer = INITIALIZER) =>
  ISkillSelfAcquisition__factory.connect(contract.address, signer);

export const asTestSkill = (contract: Contract, signer: Signer = INITIALIZER) =>
  TestSkillFacet__factory.connect(contract.address, signer);

export interface CreateSkillOptions extends ExtensibleDiamondOptions {}

export const createSkill = async (options: CreateSkillOptions = {}) =>
  asSkill(
    await createDiamond(
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [buildDiamondFacetCut(await deploySkillFacet())],
          additionalRoleAdmins: [{ role: SUPER_ADMIN_ROLE, admins: [INITIALIZER.address] }],
        },
        options,
      ),
    ),
  );

export const createSelfAcquiringSkill = async (options: CreateSkillOptions = {}) =>
  asSelfAcquiringSkill(
    await createSkill(
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [buildDiamondFacetCut(await deploySkillSelfAcquisitionFacet())],
        },
        options,
      ),
    ),
  );

export const createTestSkill = async (options: CreateSkillOptions = {}) =>
  asTestSkill(
    await createSkill(
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [buildDiamondFacetCut(await deployTestSkillFacet())],
        },
        options,
      ),
    ),
  );

export const deploySkillFacet = () => new SkillFacet__factory(INITIALIZER).deploy();
export const deploySkillSelfAcquisitionFacet = () => new SkillSelfAcquisitionFacet__factory(INITIALIZER).deploy();
export const deployTestSkillFacet = () => new TestSkillFacet__factory(INITIALIZER).deploy();

export const toSkillLevel = (skillLevel: SkillLevelBN): SkillLevel => {
  const { skill, level } = skillLevel;
  return { skill, level: level.toNumber() };
};

export const toSkillLevelAsync = async (skillLevel: Promise<SkillLevelBN> | SkillLevelBN): Promise<SkillLevel> =>
  toSkillLevel(await skillLevel);
