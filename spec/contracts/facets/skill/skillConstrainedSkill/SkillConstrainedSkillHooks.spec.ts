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
import { PLAYER1, PLAYER2 } from '../../../../helpers/Accounts';
import { buildSkillConstrainedSkillAdditions } from '../../../../helpers/facets/SkillConstrainedSkillHelper';
import { asSkill, createSelfAcquiringSkill, createTestSkill } from '../../../../helpers/facets/SkillFacetHelper';

describe('acquireNext', () => {
  it('should get the correct levels', async () => {
    const basicSkill1 = await createTestSkill();
    const basicSkill2 = await createTestSkill();

    const constrainedSkill = await createSelfAcquiringSkill(
      await buildSkillConstrainedSkillAdditions([
        { skill: basicSkill1.address, level: 1 },
        { skill: basicSkill2.address, level: 2 },
      ]),
    );

    await basicSkill1.connect(PLAYER1).acquire(1);
    await basicSkill2.connect(PLAYER1).acquire(2);

    await constrainedSkill.connect(PLAYER1).acquireNext([]);

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(PLAYER1.address)).toEqBN(1);
    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(PLAYER2.address)).toEqBN(0);

    await basicSkill1.connect(PLAYER2).acquire(1);
    await basicSkill2.connect(PLAYER2).acquire(2);

    await constrainedSkill.connect(PLAYER2).acquireNext([]);

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(PLAYER1.address)).toEqBN(1);
    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(PLAYER2.address)).toEqBN(1);

    await constrainedSkill.connect(PLAYER1).acquireNext([]);

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(PLAYER1.address)).toEqBN(2);
    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(PLAYER2.address)).toEqBN(1);

    await constrainedSkill.connect(PLAYER1).acquireNext([]);

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(PLAYER1.address)).toEqBN(3);
    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(PLAYER2.address)).toEqBN(1);

    await constrainedSkill.connect(PLAYER2).acquireNext([]);

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(PLAYER1.address)).toEqBN(3);
    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(PLAYER2.address)).toEqBN(2);
  });

  it('should revert when any dependent skill level not found for player', async () => {
    const basicSkill1 = await createTestSkill();
    const basicSkill2 = await createTestSkill();

    const constrainedSkill = await createSelfAcquiringSkill(
      await buildSkillConstrainedSkillAdditions([
        { skill: basicSkill1.address, level: 1 },
        { skill: basicSkill2.address, level: 2 },
      ]),
    );

    await basicSkill1.connect(PLAYER2).acquire(1);
    await basicSkill2.connect(PLAYER2).acquire(2);

    await expect<Promise<ContractTransaction>>(constrainedSkill.connect(PLAYER1).acquireNext([])).toBeRevertedWith(
      'missing required skill',
    );

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(PLAYER1.address)).toEqBN(0);

    await basicSkill2.connect(PLAYER1).acquireNext();

    await expect<Promise<ContractTransaction>>(constrainedSkill.connect(PLAYER1).acquireNext([])).toBeRevertedWith(
      'missing required skill',
    );

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(PLAYER1.address)).toEqBN(0);

    await basicSkill1.connect(PLAYER1).acquireNext();

    await expect<Promise<ContractTransaction>>(constrainedSkill.connect(PLAYER1).acquireNext([])).toBeRevertedWith(
      'missing required skill',
    );

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(PLAYER1.address)).toEqBN(0);

    await basicSkill1.connect(PLAYER1).acquireNext();

    await expect<Promise<ContractTransaction>>(constrainedSkill.connect(PLAYER1).acquireNext([])).toBeRevertedWith(
      'missing required skill',
    );

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(PLAYER1.address)).toEqBN(0);
  });
});
