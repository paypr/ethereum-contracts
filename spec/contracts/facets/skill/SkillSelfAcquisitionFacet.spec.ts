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

import { BigNumber, ContractTransaction } from 'ethers';
import { buildDiamondFacetCut } from '../../../../src/contracts/diamonds';
import { SKILL_SELF_ACQUISITION_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { PLAYER1, PLAYER2 } from '../../../helpers/Accounts';
import { deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import { asDisableable, buildDisableableDiamondAdditions } from '../../../helpers/facets/DisableableFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';
import {
  asSkill,
  createSelfAcquiringSkill,
  deploySkillSelfAcquisitionFacet,
} from '../../../helpers/facets/SkillFacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deploySkillSelfAcquisitionFacet()),
      ]),
    );

  shouldSupportInterface('SkillSelfAcquisition', createDiamondForErc165, SKILL_SELF_ACQUISITION_INTERFACE_ID);
});

describe('acquireNext', () => {
  it('should get the first level when no levels found', async () => {
    const skill = await createSelfAcquiringSkill();

    await skill.connect(PLAYER1).acquireNext([]);

    expect<BigNumber>(await asSkill(skill).currentLevel(PLAYER1.address)).toEqBN(1);
  });

  it('should send Acquired event when no levels found', async () => {
    const skill = await createSelfAcquiringSkill();

    await expect<ContractTransaction>(await skill.connect(PLAYER1).acquireNext([])).toHaveEmittedWith(
      asSkill(skill),
      'Acquired',
      [PLAYER1.address, '1'],
    );
  });

  it('should get the first level when no level found for player', async () => {
    const skill = await createSelfAcquiringSkill();

    await skill.connect(PLAYER2).acquireNext([]);
    await skill.connect(PLAYER1).acquireNext([]);

    expect<BigNumber>(await asSkill(skill).currentLevel(PLAYER1.address)).toEqBN(1);
  });

  it('should get the next level when level found for player', async () => {
    const skill = await createSelfAcquiringSkill();

    await skill.connect(PLAYER1).acquireNext([]);

    expect<BigNumber>(await asSkill(skill).currentLevel(PLAYER1.address)).toEqBN(1);
    expect<BigNumber>(await asSkill(skill).currentLevel(PLAYER2.address)).toEqBN(0);

    await skill.connect(PLAYER1).acquireNext([]);

    expect<BigNumber>(await asSkill(skill).currentLevel(PLAYER1.address)).toEqBN(2);
    expect<BigNumber>(await asSkill(skill).currentLevel(PLAYER2.address)).toEqBN(0);

    await skill.connect(PLAYER2).acquireNext([]);

    expect<BigNumber>(await asSkill(skill).currentLevel(PLAYER1.address)).toEqBN(2);
    expect<BigNumber>(await asSkill(skill).currentLevel(PLAYER2.address)).toEqBN(1);

    await skill.connect(PLAYER1).acquireNext([]);

    expect<BigNumber>(await asSkill(skill).currentLevel(PLAYER1.address)).toEqBN(3);
    expect<BigNumber>(await asSkill(skill).currentLevel(PLAYER2.address)).toEqBN(1);

    await skill.connect(PLAYER2).acquireNext([]);

    expect<BigNumber>(await asSkill(skill).currentLevel(PLAYER1.address)).toEqBN(3);
    expect<BigNumber>(await asSkill(skill).currentLevel(PLAYER2.address)).toEqBN(2);
  });

  it('should send Acquired event for advanced level', async () => {
    const skill = await createSelfAcquiringSkill();

    await skill.connect(PLAYER1).acquireNext([]);
    await skill.connect(PLAYER1).acquireNext([]);
    await skill.connect(PLAYER2).acquireNext([]);
    await expect<ContractTransaction>(await skill.connect(PLAYER1).acquireNext([])).toHaveEmittedWith(
      asSkill(skill),
      'Acquired',
      [PLAYER1.address, '3'],
    );
  });

  it('should not acquire skill if disabled', async () => {
    const skill = await createSelfAcquiringSkill(await buildDisableableDiamondAdditions());

    await asDisableable(skill).disable();

    await expect<Promise<ContractTransaction>>(skill.connect(PLAYER1).acquireNext([])).toBeRevertedWith(
      'Contract is disabled',
    );
  });
});
