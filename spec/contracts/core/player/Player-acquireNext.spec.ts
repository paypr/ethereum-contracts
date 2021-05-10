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
import { Item } from '../../../../src/contracts/core/activities';
import { PLAYER1, PLAYER_ADMIN } from '../../../helpers/Accounts';
import { createArtifact, mintItem } from '../../../helpers/ArtifactHelper';
import { createConsumable, mintConsumable } from '../../../helpers/ConsumableHelper';
import { disableContract } from '../../../helpers/DisableableHelper';
import { createPlayer } from '../../../helpers/PlayerHelper';
import { createConstrainedSkill, createSkill } from '../../../helpers/SkillHelper';

it('should acquire a simple skill', async () => {
  const player = await createPlayer();

  const skill1 = await createSkill({ name: 'Skill 1' });
  const skill2 = await createSkill({ name: 'Skill 2' });

  await player.connect(PLAYER_ADMIN).acquireNext(skill1.address, [], []);

  expect<BigNumber>(await skill1.currentLevel(player.address)).toEqBN(1);

  await player.connect(PLAYER_ADMIN).acquireNext(skill1.address, [], []);

  expect<BigNumber>(await skill1.currentLevel(player.address)).toEqBN(2);

  await player.connect(PLAYER_ADMIN).acquireNext(skill2.address, [], []);

  expect<BigNumber>(await skill2.currentLevel(player.address)).toEqBN(1);

  await player.connect(PLAYER_ADMIN).acquireNext(skill1.address, [], []);

  expect<BigNumber>(await skill1.currentLevel(player.address)).toEqBN(3);
});

it('should acquire a constrained skill', async () => {
  const player = await createPlayer();

  const basicSkill1 = await createSkill({ name: 'Basic 1' });
  const basicSkill2 = await createSkill({ name: 'Basic 2' });

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  const constrainedSkill = await createConstrainedSkill(
    { name: 'Constrained' },
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { skill: basicSkill1.address, level: 1 },
      { skill: basicSkill2.address, level: 2 },
    ],
  );

  await mintConsumable(consumable1, player.address, 1000);
  await mintConsumable(consumable2, player.address, 1000);

  await player.connect(PLAYER_ADMIN).acquireNext(basicSkill1.address, [], []);
  await player.connect(PLAYER_ADMIN).acquireNext(basicSkill2.address, [], []);
  await player.connect(PLAYER_ADMIN).acquireNext(basicSkill2.address, [], []);

  await player.connect(PLAYER_ADMIN).acquireNext(
    constrainedSkill.address,
    [],
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
  );

  expect<BigNumber>(await constrainedSkill.currentLevel(player.address)).toEqBN(1);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(900);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(800);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(200);
  expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);

  await player.connect(PLAYER_ADMIN).acquireNext(
    constrainedSkill.address,
    [],
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
  );

  expect<BigNumber>(await constrainedSkill.currentLevel(player.address)).toEqBN(2);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(800);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(600);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(200);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(400);
  expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);
});

it('should use the items', async () => {
  const player = await createPlayer();

  const basicSkill1 = await createSkill({ name: 'Basic 1' });
  const basicSkill2 = await createSkill({ name: 'Basic 2' });

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  const constrainedSkill = await createConstrainedSkill(
    { name: 'Constrained' },
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { skill: basicSkill1.address, level: 1 },
      { skill: basicSkill2.address, level: 2 },
    ],
  );

  const artifact1 = await createArtifact(
    { name: 'Artifact 1' },
    '',
    '',
    [
      { consumable: consumable1.address, amount: 50 },
      { consumable: consumable2.address, amount: 100 },
    ],
    2,
  );
  const artifact2 = await createArtifact({ name: 'Artifact 2' }, '', '', [
    { consumable: consumable2.address, amount: 100 },
  ]);

  await mintConsumable(consumable1, player.address, 1000);
  await mintConsumable(consumable2, player.address, 1000);

  await mintConsumable(consumable1, artifact1.address, 1000);
  await mintConsumable(consumable2, artifact1.address, 1000);

  await mintItem(artifact1, player.address);
  const item1: Item = { artifact: artifact1.address, itemId: '1' };

  await mintConsumable(consumable1, artifact2.address, 1000);
  await mintConsumable(consumable2, artifact2.address, 1000);

  await mintItem(artifact2, player.address);
  const item2: Item = { artifact: artifact2.address, itemId: '1' };
  await mintItem(artifact2, player.address);
  const item3: Item = { artifact: artifact2.address, itemId: '2' };

  await player.connect(PLAYER_ADMIN).acquireNext(basicSkill1.address, [], []);
  await player.connect(PLAYER_ADMIN).acquireNext(basicSkill2.address, [], []);
  await player.connect(PLAYER_ADMIN).acquireNext(basicSkill2.address, [], []);

  await player
    .connect(PLAYER_ADMIN)
    .acquireNext(constrainedSkill.address, [item1, item2], [{ consumable: consumable1.address, amount: 50 }]);

  expect<BigNumber>(await constrainedSkill.currentLevel(player.address)).toEqBN(1);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(950);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(200);
  expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await artifact1.usesLeft('1')).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft('1')).toEqBN(0);
  expect<BigNumber>(await artifact2.usesLeft('2')).toEqBN(1);

  await player
    .connect(PLAYER_ADMIN)
    .acquireNext(constrainedSkill.address, [item3, item1], [{ consumable: consumable1.address, amount: 50 }]);

  expect<BigNumber>(await constrainedSkill.currentLevel(player.address)).toEqBN(2);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(900);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(200);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(400);
  expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await artifact1.usesLeft('1')).toEqBN(0);
  expect<BigNumber>(await artifact2.usesLeft('1')).toEqBN(0);
  expect<BigNumber>(await artifact2.usesLeft('2')).toEqBN(0);
});

it('should not use the items or consumables if not enough uses', async () => {
  const player = await createPlayer();

  const basicSkill1 = await createSkill({ name: 'Basic 1' });
  const basicSkill2 = await createSkill({ name: 'Basic 2' });

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  const constrainedSkill = await createConstrainedSkill(
    { name: 'Constrained' },
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { skill: basicSkill1.address, level: 1 },
      { skill: basicSkill2.address, level: 2 },
    ],
  );

  const artifact1 = await createArtifact({ name: 'Artifact 1' }, '', '', [
    { consumable: consumable1.address, amount: 50 },
    { consumable: consumable2.address, amount: 100 },
  ]);
  const artifact2 = await createArtifact({ name: 'Artifact 2' }, '', '', [
    { consumable: consumable2.address, amount: 100 },
  ]);

  await mintConsumable(consumable1, player.address, 1000);
  await mintConsumable(consumable2, player.address, 1000);

  await mintConsumable(consumable1, artifact1.address, 1000);
  await mintConsumable(consumable2, artifact1.address, 1000);

  await mintItem(artifact1, player.address);
  const item1: Item = { artifact: artifact1.address, itemId: '1' };

  await mintConsumable(consumable1, artifact2.address, 1000);
  await mintConsumable(consumable2, artifact2.address, 1000);

  await mintItem(artifact2, player.address);
  const item2: Item = { artifact: artifact2.address, itemId: '1' };
  await mintItem(artifact2, player.address);
  const item3: Item = { artifact: artifact2.address, itemId: '2' };

  await player.connect(PLAYER_ADMIN).acquireNext(basicSkill1.address, [item1], []);
  await player.connect(PLAYER_ADMIN).acquireNext(basicSkill2.address, [], []);
  await player.connect(PLAYER_ADMIN).acquireNext(basicSkill2.address, [], []);

  await expect<Promise<ContractTransaction>>(
    player.connect(PLAYER_ADMIN).acquireNext(
      constrainedSkill.address,
      [item1, item2, item3],
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
    ),
  ).toBeRevertedWith('no uses left for item');

  expect<BigNumber>(await constrainedSkill.currentLevel(player.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await artifact1.usesLeft('1')).toEqBN(0);
  expect<BigNumber>(await artifact2.usesLeft('1')).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft('2')).toEqBN(1);

  await player.connect(PLAYER_ADMIN).acquireNext(basicSkill1.address, [item3], []);

  await expect<Promise<ContractTransaction>>(
    player.connect(PLAYER_ADMIN).acquireNext(
      constrainedSkill.address,
      [item2, item3],
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
    ),
  ).toBeRevertedWith('no uses left for item');

  expect<BigNumber>(await constrainedSkill.currentLevel(player.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await artifact1.usesLeft('1')).toEqBN(0);
  expect<BigNumber>(await artifact2.usesLeft('1')).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft('2')).toEqBN(0);
});

it('should not use the items or consumables if not enough of any consumables provided', async () => {
  const player = await createPlayer();

  const basicSkill1 = await createSkill({ name: 'Basic 1' });
  const basicSkill2 = await createSkill({ name: 'Basic 2' });

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  const constrainedSkill = await createConstrainedSkill(
    { name: 'Constrained' },
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { skill: basicSkill1.address, level: 1 },
      { skill: basicSkill2.address, level: 2 },
    ],
  );

  const artifact1 = await createArtifact({ name: 'Artifact 1' }, '', '', [
    { consumable: consumable1.address, amount: 50 },
    { consumable: consumable2.address, amount: 100 },
  ]);
  const artifact2 = await createArtifact({ name: 'Artifact 2' }, '', '', [
    { consumable: consumable2.address, amount: 100 },
  ]);

  await mintConsumable(consumable1, player.address, 1000);
  await mintConsumable(consumable2, player.address, 1000);

  await mintConsumable(consumable1, artifact1.address, 1000);
  await mintConsumable(consumable2, artifact1.address, 1000);

  await mintItem(artifact1, player.address);
  const item1: Item = { artifact: artifact1.address, itemId: '1' };

  await mintConsumable(consumable1, artifact2.address, 1000);
  await mintConsumable(consumable2, artifact2.address, 1000);

  await mintItem(artifact2, player.address);
  const item2: Item = { artifact: artifact2.address, itemId: '1' };
  await mintItem(artifact2, player.address);
  const item3: Item = { artifact: artifact2.address, itemId: '2' };

  await player.connect(PLAYER_ADMIN).acquireNext(basicSkill1.address, [], []);
  await player.connect(PLAYER_ADMIN).acquireNext(basicSkill2.address, [], []);
  await player.connect(PLAYER_ADMIN).acquireNext(basicSkill2.address, [], []);

  await expect<Promise<ContractTransaction>>(
    player.connect(PLAYER_ADMIN).acquireNext(
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

  expect<BigNumber>(await constrainedSkill.currentLevel(player.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await artifact1.usesLeft('1')).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft('1')).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft('2')).toEqBN(1);

  await expect<Promise<ContractTransaction>>(
    player.connect(PLAYER_ADMIN).acquireNext(
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

  expect<BigNumber>(await constrainedSkill.currentLevel(player.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await artifact1.usesLeft('1')).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft('1')).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft('2')).toEqBN(1);
});

it('should not use the items or consumables if not enough of any consumables to provide', async () => {
  const player = await createPlayer();

  const basicSkill1 = await createSkill({ name: 'Basic 1' });
  const basicSkill2 = await createSkill({ name: 'Basic 2' });

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  const constrainedSkill = await createConstrainedSkill(
    { name: 'Constrained' },
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { skill: basicSkill1.address, level: 1 },
      { skill: basicSkill2.address, level: 2 },
    ],
  );

  const artifact1 = await createArtifact({ name: 'Artifact 1' }, '', '', [
    { consumable: consumable1.address, amount: 50 },
    { consumable: consumable2.address, amount: 100 },
  ]);
  const artifact2 = await createArtifact({ name: 'Artifact 2' }, '', '', [
    { consumable: consumable2.address, amount: 100 },
  ]);

  await mintConsumable(consumable1, player.address, 1000);
  await mintConsumable(consumable2, player.address, 1000);

  await mintConsumable(consumable1, artifact1.address, 1000);
  await mintConsumable(consumable2, artifact1.address, 1000);

  await mintItem(artifact1, player.address);
  const item1: Item = { artifact: artifact1.address, itemId: '1' };

  await mintConsumable(consumable1, artifact2.address, 1000);
  await mintConsumable(consumable2, artifact2.address, 1000);

  await mintItem(artifact2, player.address);
  const item2: Item = { artifact: artifact2.address, itemId: '1' };
  await mintItem(artifact2, player.address);
  const item3: Item = { artifact: artifact2.address, itemId: '2' };

  await player.connect(PLAYER_ADMIN).acquireNext(basicSkill1.address, [], []);
  await player.connect(PLAYER_ADMIN).acquireNext(basicSkill2.address, [], []);
  await player.connect(PLAYER_ADMIN).acquireNext(basicSkill2.address, [], []);

  await expect<Promise<ContractTransaction>>(
    player
      .connect(PLAYER_ADMIN)
      .acquireNext(
        constrainedSkill.address,
        [item1, item2, item3],
        [{ consumable: consumable1.address, amount: 10000 }],
      ),
  ).toBeRevertedWith('transfer amount exceeds balance');

  expect<BigNumber>(await constrainedSkill.currentLevel(player.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable1.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.balanceOf(constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable1.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, constrainedSkill.address)).toEqBN(0);
  expect<BigNumber>(await artifact1.usesLeft('1')).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft('1')).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft('2')).toEqBN(1);
});

it('should revert when skill address is not a skill', async () => {
  const player = await createPlayer();

  const notASkill = await createConsumable({ name: 'Not a skill' });

  await expect<Promise<ContractTransaction>>(
    player.connect(PLAYER_ADMIN).acquireNext(notASkill.address, [], []),
  ).toBeRevertedWith('skill address must support ISkill');
});

it('should revert when any item is not an artifact', async () => {
  const player = await createPlayer();

  const skill = await createSkill({ name: 'Skill' });

  const artifact = await createArtifact({ name: 'Artifact' });

  await mintItem(artifact, player.address);

  const notAnArtifact = await createConsumable({ name: 'Not an artifact' });

  await expect<Promise<ContractTransaction>>(
    player.connect(PLAYER_ADMIN).acquireNext(
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
  const player = await createPlayer();

  const skill = await createSkill({ name: 'Skill' });

  const artifact1 = await createArtifact({ name: 'Artifact 1' });
  await mintItem(artifact1, player.address);

  const artifact2 = await createArtifact({ name: 'Artifact 2' });
  await mintItem(artifact2, PLAYER1.address);

  await expect<Promise<ContractTransaction>>(
    player.connect(PLAYER_ADMIN).acquireNext(
      skill.address,
      [
        { artifact: artifact1.address, itemId: 1 },
        { artifact: artifact2.address, itemId: 1 },
      ],
      [],
    ),
  ).toBeRevertedWith('must be used by the owner');

  await expect<Promise<ContractTransaction>>(
    player.connect(PLAYER_ADMIN).acquireNext(
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
  const player = await createPlayer();

  const skill = await createSkill({ name: 'Skill' });

  const consumable = await createConsumable({ name: 'Consumable' });
  const notAConsumable = await createArtifact({ name: 'Not a consumable' });

  await mintConsumable(consumable, player.address, 1000);

  await expect<Promise<ContractTransaction>>(
    player.connect(PLAYER_ADMIN).acquireNext(
      skill.address,
      [],
      [
        { consumable: consumable.address, amount: 100 },
        { consumable: notAConsumable.address, amount: 200 },
      ],
    ),
  ).toBeRevertedWith('Consumable must support interface when providing');
});

it('should revert when not called by owner', async () => {
  const player = await createPlayer();

  const skill = await createSkill({ name: 'Skill' });

  await expect<Promise<ContractTransaction>>(
    player.connect(PLAYER1).acquireNext(skill.address, [], []),
  ).toBeRevertedWith('Caller does not have the Admin role');
});

it('should not acquire the skill if disabled', async () => {
  const player = await createPlayer();

  const skill = await createSkill({ name: 'Skill 1' });

  await disableContract(player, PLAYER_ADMIN);

  await expect<Promise<ContractTransaction>>(
    player.connect(PLAYER_ADMIN).acquireNext(skill.address, [], []),
  ).toBeRevertedWith('Contract is disabled');
});
