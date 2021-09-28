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
import { Item } from '../../../../../src/contracts/artifacts';
import { buildDiamondFacetCut } from '../../../../../src/contracts/core/diamonds';
import { SKILL_ACQUIRER_INTERFACE_ID } from '../../../../../src/contracts/erc165InterfaceIds';
import { PLAYER1 } from '../../../../helpers/Accounts';
import { combineExtensibleDiamondOptions, deployDiamond } from '../../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../../helpers/ERC165Helper';
import { asArtifact, createMintableArtifact } from '../../../../helpers/facets/ArtifactFacetHelper';
import { buildConsumableConsumerSkillAdditions } from '../../../../helpers/facets/ConsumableConsumerSkillHelper';
import { asConsumableMint, createConsumable } from '../../../../helpers/facets/ConsumableFacetHelper';
import { buildConsumableProviderDiamondAdditions } from '../../../../helpers/facets/ConsumableProviderFacetHelper';
import { asDisableable, buildDisableableDiamondAdditions } from '../../../../helpers/facets/DisableableFacetHelper';
import { asErc165, deployErc165Facet } from '../../../../helpers/facets/ERC165FacetHelper';
import { createSkillAcquirer, deploySkillAcquirerFacet } from '../../../../helpers/facets/SkillAcquirerHelper';
import { buildSkillConstrainedSkillAdditions } from '../../../../helpers/facets/SkillConstrainedSkillHelper';
import { asSkill, createSelfAcquiringSkill } from '../../../../helpers/facets/SkillFacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deploySkillAcquirerFacet()),
      ]),
    );

  shouldSupportInterface('SkillAcquirer', createDiamondForErc165, SKILL_ACQUIRER_INTERFACE_ID);
});

describe('acquireNext', () => {
  it('should acquire a simple skill', async () => {
    const player = await createSkillAcquirer();

    const skill1 = await createSelfAcquiringSkill();
    const skill2 = await createSelfAcquiringSkill();

    await player.acquireNext(skill1.address, [], []);

    expect<BigNumber>(await asSkill(skill1).currentLevel(player.address)).toEqBN(1);

    await player.acquireNext(skill1.address, [], []);

    expect<BigNumber>(await asSkill(skill1).currentLevel(player.address)).toEqBN(2);

    await player.acquireNext(skill2.address, [], []);

    expect<BigNumber>(await asSkill(skill2).currentLevel(player.address)).toEqBN(1);

    await player.acquireNext(skill1.address, [], []);

    expect<BigNumber>(await asSkill(skill1).currentLevel(player.address)).toEqBN(3);
  });

  it('should acquire a constrained skill', async () => {
    const player = await createSkillAcquirer();

    const basicSkill1 = await createSelfAcquiringSkill();
    const basicSkill2 = await createSelfAcquiringSkill();

    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const constrainedSkill = await createSelfAcquiringSkill(
      combineExtensibleDiamondOptions(
        await buildConsumableConsumerSkillAdditions([
          { consumable: consumable1.address, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ]),
        await buildSkillConstrainedSkillAdditions([
          { skill: basicSkill1.address, level: 1 },
          { skill: basicSkill2.address, level: 2 },
        ]),
      ),
    );

    await asConsumableMint(consumable1).mint(player.address, 1000);
    await asConsumableMint(consumable2).mint(player.address, 1000);

    await player.acquireNext(basicSkill1.address, [], []);
    await player.acquireNext(basicSkill2.address, [], []);
    await player.acquireNext(basicSkill2.address, [], []);

    await player.acquireNext(
      constrainedSkill.address,
      [],
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
    );

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(player.address)).toEqBN(1);

    expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(800);
    expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(200);
    expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);

    await player.acquireNext(
      constrainedSkill.address,
      [],
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
    );

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(player.address)).toEqBN(2);

    expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(800);
    expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(600);
    expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(200);
    expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(400);
    expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  });

  it('should use the items', async () => {
    const player = await createSkillAcquirer();

    const basicSkill1 = await createSelfAcquiringSkill();
    const basicSkill2 = await createSelfAcquiringSkill();

    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const constrainedSkill = await createSelfAcquiringSkill(
      combineExtensibleDiamondOptions(
        await buildConsumableConsumerSkillAdditions([
          { consumable: consumable1.address, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ]),
        await buildSkillConstrainedSkillAdditions([
          { skill: basicSkill1.address, level: 1 },
          { skill: basicSkill2.address, level: 2 },
        ]),
      ),
    );

    const artifact1 = await createMintableArtifact(
      2,
      await buildConsumableProviderDiamondAdditions([
        { consumable: consumable1.address, amount: 50 },
        { consumable: consumable2.address, amount: 100 },
      ]),
    );
    const artifact2 = await createMintableArtifact(
      1,
      await buildConsumableProviderDiamondAdditions([{ consumable: consumable2.address, amount: 100 }]),
    );

    await asConsumableMint(consumable1).mint(player.address, 1000);
    await asConsumableMint(consumable2).mint(player.address, 1000);

    await asConsumableMint(consumable1).mint(artifact1.address, 1000);
    await asConsumableMint(consumable2).mint(artifact1.address, 1000);

    await artifact1.mint(player.address);
    const item1: Item = { artifact: artifact1.address, itemId: '1' };

    await asConsumableMint(consumable1).mint(artifact2.address, 1000);
    await asConsumableMint(consumable2).mint(artifact2.address, 1000);

    await artifact2.mint(player.address);
    const item2: Item = { artifact: artifact2.address, itemId: '1' };
    await artifact2.mint(player.address);
    const item3: Item = { artifact: artifact2.address, itemId: '2' };

    await player.acquireNext(basicSkill1.address, [], []);
    await player.acquireNext(basicSkill2.address, [], []);
    await player.acquireNext(basicSkill2.address, [], []);

    await player.acquireNext(
      constrainedSkill.address,
      [item1, item2],
      [{ consumable: consumable1.address, amount: 50 }],
    );

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(player.address)).toEqBN(1);

    expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(950);
    expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(100);
    expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(200);
    expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await asArtifact(artifact1).usesLeft('1')).toEqBN(1);
    expect<BigNumber>(await asArtifact(artifact2).usesLeft('1')).toEqBN(0);
    expect<BigNumber>(await asArtifact(artifact2).usesLeft('2')).toEqBN(1);

    await player.acquireNext(
      constrainedSkill.address,
      [item3, item1],
      [{ consumable: consumable1.address, amount: 50 }],
    );

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(player.address)).toEqBN(2);

    expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(900);
    expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(200);
    expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(400);
    expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await asArtifact(artifact1).usesLeft('1')).toEqBN(0);
    expect<BigNumber>(await asArtifact(artifact2).usesLeft('1')).toEqBN(0);
    expect<BigNumber>(await asArtifact(artifact2).usesLeft('2')).toEqBN(0);
  });

  it('should not use the items or consumables if not enough uses', async () => {
    const player = await createSkillAcquirer();

    const basicSkill1 = await createSelfAcquiringSkill();
    const basicSkill2 = await createSelfAcquiringSkill();

    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const constrainedSkill = await createSelfAcquiringSkill(
      combineExtensibleDiamondOptions(
        await buildConsumableConsumerSkillAdditions([
          { consumable: consumable1.address, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ]),
        await buildSkillConstrainedSkillAdditions([
          { skill: basicSkill1.address, level: 1 },
          { skill: basicSkill2.address, level: 2 },
        ]),
      ),
    );

    const artifact1 = await createMintableArtifact(
      1,
      await buildConsumableProviderDiamondAdditions([
        { consumable: consumable1.address, amount: 50 },
        { consumable: consumable2.address, amount: 100 },
      ]),
    );
    const artifact2 = await createMintableArtifact(
      1,
      await buildConsumableProviderDiamondAdditions([{ consumable: consumable2.address, amount: 100 }]),
    );

    await asConsumableMint(consumable1).mint(player.address, 1000);
    await asConsumableMint(consumable2).mint(player.address, 1000);

    await asConsumableMint(consumable1).mint(artifact1.address, 1000);
    await asConsumableMint(consumable2).mint(artifact1.address, 1000);

    await artifact1.mint(player.address);
    const item1: Item = { artifact: artifact1.address, itemId: '1' };

    await asConsumableMint(consumable1).mint(artifact2.address, 1000);
    await asConsumableMint(consumable2).mint(artifact2.address, 1000);

    await artifact2.mint(player.address);
    const item2: Item = { artifact: artifact2.address, itemId: '1' };
    await artifact2.mint(player.address);
    const item3: Item = { artifact: artifact2.address, itemId: '2' };

    await player.acquireNext(basicSkill1.address, [item1], []);
    await player.acquireNext(basicSkill2.address, [], []);
    await player.acquireNext(basicSkill2.address, [], []);

    await expect<Promise<ContractTransaction>>(
      player.acquireNext(
        constrainedSkill.address,
        [item1, item2, item3],
        [
          { consumable: consumable1.address, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ],
      ),
    ).toBeRevertedWith('no uses left for item');

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(player.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await asArtifact(artifact1).usesLeft('1')).toEqBN(0);
    expect<BigNumber>(await asArtifact(artifact2).usesLeft('1')).toEqBN(1);
    expect<BigNumber>(await asArtifact(artifact2).usesLeft('2')).toEqBN(1);

    await player.acquireNext(basicSkill1.address, [item3], []);

    await expect<Promise<ContractTransaction>>(
      player.acquireNext(
        constrainedSkill.address,
        [item2, item3],
        [
          { consumable: consumable1.address, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ],
      ),
    ).toBeRevertedWith('no uses left for item');

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(player.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await asArtifact(artifact1).usesLeft('1')).toEqBN(0);
    expect<BigNumber>(await asArtifact(artifact2).usesLeft('1')).toEqBN(1);
    expect<BigNumber>(await asArtifact(artifact2).usesLeft('2')).toEqBN(0);
  });

  it('should not use the items or consumables if not enough of any consumables provided', async () => {
    const player = await createSkillAcquirer();

    const basicSkill1 = await createSelfAcquiringSkill();
    const basicSkill2 = await createSelfAcquiringSkill();

    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const constrainedSkill = await createSelfAcquiringSkill(
      combineExtensibleDiamondOptions(
        await buildConsumableConsumerSkillAdditions([
          { consumable: consumable1.address, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ]),
        await buildSkillConstrainedSkillAdditions([
          { skill: basicSkill1.address, level: 1 },
          { skill: basicSkill2.address, level: 2 },
        ]),
      ),
    );

    const artifact1 = await createMintableArtifact(
      1,
      await buildConsumableProviderDiamondAdditions([
        { consumable: consumable1.address, amount: 50 },
        { consumable: consumable2.address, amount: 100 },
      ]),
    );
    const artifact2 = await createMintableArtifact(
      1,
      await buildConsumableProviderDiamondAdditions([{ consumable: consumable2.address, amount: 100 }]),
    );

    await asConsumableMint(consumable1).mint(player.address, 1000);
    await asConsumableMint(consumable2).mint(player.address, 1000);

    await asConsumableMint(consumable1).mint(artifact1.address, 1000);
    await asConsumableMint(consumable2).mint(artifact1.address, 1000);

    await artifact1.mint(player.address);
    const item1: Item = { artifact: artifact1.address, itemId: '1' };

    await asConsumableMint(consumable1).mint(artifact2.address, 1000);
    await asConsumableMint(consumable2).mint(artifact2.address, 1000);

    await artifact2.mint(player.address);
    const item2: Item = { artifact: artifact2.address, itemId: '1' };
    await artifact2.mint(player.address);
    const item3: Item = { artifact: artifact2.address, itemId: '2' };

    await player.acquireNext(basicSkill1.address, [], []);
    await player.acquireNext(basicSkill2.address, [], []);
    await player.acquireNext(basicSkill2.address, [], []);

    await expect<Promise<ContractTransaction>>(
      player.acquireNext(
        constrainedSkill.address,
        [item1, item2, item3],
        [
          {
            consumable: consumable1.address,
            amount: 1,
          },
        ],
      ),
    ).toBeRevertedWith('Not enough consumable to transfer');

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(player.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await asArtifact(artifact1).usesLeft('1')).toEqBN(1);
    expect<BigNumber>(await asArtifact(artifact2).usesLeft('1')).toEqBN(1);
    expect<BigNumber>(await asArtifact(artifact2).usesLeft('2')).toEqBN(1);

    await expect<Promise<ContractTransaction>>(
      player.acquireNext(
        constrainedSkill.address,
        [item1],
        [
          {
            consumable: consumable1.address,
            amount: 100,
          },
        ],
      ),
    ).toBeRevertedWith('Not enough consumable to transfer');

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(player.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await asArtifact(artifact1).usesLeft('1')).toEqBN(1);
    expect<BigNumber>(await asArtifact(artifact2).usesLeft('1')).toEqBN(1);
    expect<BigNumber>(await asArtifact(artifact2).usesLeft('2')).toEqBN(1);
  });

  it('should not use the items or consumables if not enough of any consumables to provide', async () => {
    const player = await createSkillAcquirer();

    const basicSkill1 = await createSelfAcquiringSkill();
    const basicSkill2 = await createSelfAcquiringSkill();

    const consumable1 = await createConsumable();
    const consumable2 = await createConsumable();

    const constrainedSkill = await createSelfAcquiringSkill(
      combineExtensibleDiamondOptions(
        await buildConsumableConsumerSkillAdditions([
          { consumable: consumable1.address, amount: 100 },
          { consumable: consumable2.address, amount: 200 },
        ]),
        await buildSkillConstrainedSkillAdditions([
          { skill: basicSkill1.address, level: 1 },
          { skill: basicSkill2.address, level: 2 },
        ]),
      ),
    );

    const artifact1 = await createMintableArtifact(
      1,
      await buildConsumableProviderDiamondAdditions([
        { consumable: consumable1.address, amount: 50 },
        { consumable: consumable2.address, amount: 100 },
      ]),
    );
    const artifact2 = await createMintableArtifact(
      1,
      await buildConsumableProviderDiamondAdditions([{ consumable: consumable2.address, amount: 100 }]),
    );

    await asConsumableMint(consumable1).mint(player.address, 1000);
    await asConsumableMint(consumable2).mint(player.address, 1000);

    await asConsumableMint(consumable1).mint(artifact1.address, 1000);
    await asConsumableMint(consumable2).mint(artifact1.address, 1000);

    await artifact1.mint(player.address);
    const item1: Item = { artifact: artifact1.address, itemId: '1' };

    await asConsumableMint(consumable1).mint(artifact2.address, 1000);
    await asConsumableMint(consumable2).mint(artifact2.address, 1000);

    await artifact2.mint(player.address);
    const item2: Item = { artifact: artifact2.address, itemId: '1' };
    await artifact2.mint(player.address);
    const item3: Item = { artifact: artifact2.address, itemId: '2' };

    await player.acquireNext(basicSkill1.address, [], []);
    await player.acquireNext(basicSkill2.address, [], []);
    await player.acquireNext(basicSkill2.address, [], []);

    await expect<Promise<ContractTransaction>>(
      player.acquireNext(
        constrainedSkill.address,
        [item1, item2, item3],
        [{ consumable: consumable1.address, amount: 10000 }],
      ),
    ).toBeRevertedWith('Not enough consumable to provide');

    expect<BigNumber>(await asSkill(constrainedSkill).currentLevel(player.address)).toEqBN(0);

    expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
    expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);
    expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);
    expect<BigNumber>(await asArtifact(artifact1).usesLeft('1')).toEqBN(1);
    expect<BigNumber>(await asArtifact(artifact2).usesLeft('1')).toEqBN(1);
    expect<BigNumber>(await asArtifact(artifact2).usesLeft('2')).toEqBN(1);
  });

  it('should revert when skill address is not a skill', async () => {
    const player = await createSkillAcquirer();

    const notASkill = await createConsumable();

    await expect<Promise<ContractTransaction>>(player.acquireNext(notASkill.address, [], [])).toBeRevertedWith(
      'skill address must support ISkill',
    );
  });

  it('should revert when any item is not an artifact', async () => {
    const player = await createSkillAcquirer();

    const skill = await createSelfAcquiringSkill();

    const artifact = await createMintableArtifact();

    await artifact.mint(player.address);

    const notAnArtifact = await createConsumable();

    await expect<Promise<ContractTransaction>>(
      player.acquireNext(
        skill.address,
        [
          { artifact: artifact.address, itemId: 1 },
          { artifact: notAnArtifact.address, itemId: 1 },
        ],
        [],
      ),
    ).toBeRevertedWith('item address must support IArtifact');
  });

  it('should revert when any item is not owned by the player', async () => {
    const player = await createSkillAcquirer();

    const skill = await createSelfAcquiringSkill();

    const artifact1 = await createMintableArtifact();
    await artifact1.mint(player.address);

    const artifact2 = await createMintableArtifact();
    await artifact2.mint(PLAYER1.address);

    await expect<Promise<ContractTransaction>>(
      player.acquireNext(
        skill.address,
        [
          { artifact: artifact1.address, itemId: 1 },
          { artifact: artifact2.address, itemId: 1 },
        ],
        [],
      ),
    ).toBeRevertedWith('must be used by the owner');

    await expect<Promise<ContractTransaction>>(
      player.acquireNext(
        skill.address,
        [
          { artifact: artifact1.address, itemId: 1 },
          { artifact: artifact2.address, itemId: 2 },
        ],
        [],
      ),
    ).toBeRevertedWith('owner query for nonexistent token');
  });

  it('should revert when called with non-consumables to provide', async () => {
    const player = await createSkillAcquirer();

    const skill = await createSelfAcquiringSkill();

    const consumable = await createConsumable();
    const notAConsumable = await createMintableArtifact();

    await asConsumableMint(consumable).mint(player.address, 1000);

    await expect<Promise<ContractTransaction>>(
      player.acquireNext(
        skill.address,
        [],
        [
          { consumable: consumable.address, amount: 100 },
          { consumable: notAConsumable.address, amount: 200 },
        ],
      ),
    ).toBeReverted();
  });

  it('should revert when not called by owner', async () => {
    const player = await createSkillAcquirer();

    const skill = await createSelfAcquiringSkill();

    await expect<Promise<ContractTransaction>>(
      player.connect(PLAYER1).acquireNext(skill.address, [], []),
    ).toBeRevertedWith('missing role');
  });

  it('should not acquire the skill if disabled', async () => {
    const player = await createSkillAcquirer(await buildDisableableDiamondAdditions());

    const skill = await createSelfAcquiringSkill();

    await asDisableable(player).disable();

    await expect<Promise<ContractTransaction>>(player.acquireNext(skill.address, [], [])).toBeRevertedWith(
      'Contract is disabled',
    );
  });
});
