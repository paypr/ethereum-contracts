/*
 * Copyright (c) 2020 The Paypr Company
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

import { expectRevert } from '@openzeppelin/test-helpers';
import { Item } from '../../../../src/contracts/core/activities';
import { PLAYER1, PLAYER_ADMIN } from '../../../helpers/Accounts';
import { createArtifact, getItemUsesLeft, mintItem } from '../../../helpers/ArtifactHelper';
import { createConsumable, getAllowance, getBalance, mintConsumable } from '../../../helpers/ConsumableHelper';
import { disableContract } from '../../../helpers/DisableableHelper';
import { createPlayer } from '../../../helpers/PlayerHelper';
import { createConstrainedSkill, createSkill, getSkilllevel } from '../../../helpers/SkillHelper';

it('should acquire a simple skill', async () => {
  const player = await createPlayer();

  const skill1 = await createSkill({ name: 'Skill 1' });
  const skill2 = await createSkill({ name: 'Skill 2' });

  await player.acquireNext(skill1.address, [], [], { from: PLAYER_ADMIN });

  expect<number>(await getSkilllevel(skill1, player.address)).toEqual(1);

  await player.acquireNext(skill1.address, [], [], { from: PLAYER_ADMIN });

  expect<number>(await getSkilllevel(skill1, player.address)).toEqual(2);

  await player.acquireNext(skill2.address, [], [], { from: PLAYER_ADMIN });

  expect<number>(await getSkilllevel(skill2, player.address)).toEqual(1);

  await player.acquireNext(skill1.address, [], [], { from: PLAYER_ADMIN });

  expect<number>(await getSkilllevel(skill1, player.address)).toEqual(3);
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

  await player.acquireNext(basicSkill1.address, [], [], { from: PLAYER_ADMIN });
  await player.acquireNext(basicSkill2.address, [], [], { from: PLAYER_ADMIN });
  await player.acquireNext(basicSkill2.address, [], [], { from: PLAYER_ADMIN });

  await player.acquireNext(
    constrainedSkill.address,
    [],
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    { from: PLAYER_ADMIN },
  );

  expect<number>(await getSkilllevel(constrainedSkill, player.address)).toEqual(1);

  expect<number>(await getBalance(consumable1, player.address)).toEqual(900);
  expect<number>(await getBalance(consumable2, player.address)).toEqual(800);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(100);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(200);
  expect<number>(await getAllowance(consumable1, player.address, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, player.address, constrainedSkill.address)).toEqual(0);

  await player.acquireNext(
    constrainedSkill.address,
    [],
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    { from: PLAYER_ADMIN },
  );

  expect<number>(await getSkilllevel(constrainedSkill, player.address)).toEqual(2);

  expect<number>(await getBalance(consumable1, player.address)).toEqual(800);
  expect<number>(await getBalance(consumable2, player.address)).toEqual(600);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(200);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(400);
  expect<number>(await getAllowance(consumable1, player.address, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, player.address, constrainedSkill.address)).toEqual(0);
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

  await player.acquireNext(basicSkill1.address, [], [], { from: PLAYER_ADMIN });
  await player.acquireNext(basicSkill2.address, [], [], { from: PLAYER_ADMIN });
  await player.acquireNext(basicSkill2.address, [], [], { from: PLAYER_ADMIN });

  await player.acquireNext(
    constrainedSkill.address,
    [item1, item2],
    [{ consumable: consumable1.address, amount: 50 }],
    {
      from: PLAYER_ADMIN,
    },
  );

  expect<number>(await getSkilllevel(constrainedSkill, player.address)).toEqual(1);

  expect<number>(await getBalance(consumable1, player.address)).toEqual(950);
  expect<number>(await getBalance(consumable2, player.address)).toEqual(1000);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(100);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(200);
  expect<number>(await getAllowance(consumable1, player.address, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, player.address, constrainedSkill.address)).toEqual(0);
  expect<number>(await getItemUsesLeft(artifact1, '1')).toEqual(1);
  expect<number>(await getItemUsesLeft(artifact2, '1')).toEqual(0);
  expect<number>(await getItemUsesLeft(artifact2, '2')).toEqual(1);

  await player.acquireNext(
    constrainedSkill.address,
    [item3, item1],
    [{ consumable: consumable1.address, amount: 50 }],
    {
      from: PLAYER_ADMIN,
    },
  );

  expect<number>(await getSkilllevel(constrainedSkill, player.address)).toEqual(2);

  expect<number>(await getBalance(consumable1, player.address)).toEqual(900);
  expect<number>(await getBalance(consumable2, player.address)).toEqual(1000);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(200);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(400);
  expect<number>(await getAllowance(consumable1, player.address, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, player.address, constrainedSkill.address)).toEqual(0);
  expect<number>(await getItemUsesLeft(artifact1, '1')).toEqual(0);
  expect<number>(await getItemUsesLeft(artifact2, '1')).toEqual(0);
  expect<number>(await getItemUsesLeft(artifact2, '2')).toEqual(0);
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

  await player.acquireNext(basicSkill1.address, [item1], [], { from: PLAYER_ADMIN });
  await player.acquireNext(basicSkill2.address, [], [], { from: PLAYER_ADMIN });
  await player.acquireNext(basicSkill2.address, [], [], { from: PLAYER_ADMIN });

  await expectRevert(
    player.acquireNext(
      constrainedSkill.address,
      [item1, item2, item3],
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
      {
        from: PLAYER_ADMIN,
      },
    ),
    'no uses left for item',
  );

  expect<number>(await getSkilllevel(constrainedSkill, player.address)).toEqual(0);

  expect<number>(await getBalance(consumable1, player.address)).toEqual(1000);
  expect<number>(await getBalance(consumable2, player.address)).toEqual(1000);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, player.address, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, player.address, constrainedSkill.address)).toEqual(0);
  expect<number>(await getItemUsesLeft(artifact1, '1')).toEqual(0);
  expect<number>(await getItemUsesLeft(artifact2, '1')).toEqual(1);
  expect<number>(await getItemUsesLeft(artifact2, '2')).toEqual(1);

  await player.acquireNext(basicSkill1.address, [item3], [], { from: PLAYER_ADMIN });

  await expectRevert(
    player.acquireNext(
      constrainedSkill.address,
      [item2, item3],
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
      { from: PLAYER_ADMIN },
    ),
    'no uses left for item',
  );

  expect<number>(await getSkilllevel(constrainedSkill, player.address)).toEqual(0);

  expect<number>(await getBalance(consumable1, player.address)).toEqual(1000);
  expect<number>(await getBalance(consumable2, player.address)).toEqual(1000);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, player.address, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, player.address, constrainedSkill.address)).toEqual(0);
  expect<number>(await getItemUsesLeft(artifact1, '1')).toEqual(0);
  expect<number>(await getItemUsesLeft(artifact2, '1')).toEqual(1);
  expect<number>(await getItemUsesLeft(artifact2, '2')).toEqual(0);
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

  await player.acquireNext(basicSkill1.address, [], [], { from: PLAYER_ADMIN });
  await player.acquireNext(basicSkill2.address, [], [], { from: PLAYER_ADMIN });
  await player.acquireNext(basicSkill2.address, [], [], { from: PLAYER_ADMIN });

  await expectRevert(
    player.acquireNext(
      constrainedSkill.address,
      [item1, item2, item3],
      [{ consumable: consumable1.address, amount: 1 }],
      { from: PLAYER_ADMIN },
    ),
    'Not enough consumable to transfer',
  );

  expect<number>(await getSkilllevel(constrainedSkill, player.address)).toEqual(0);

  expect<number>(await getBalance(consumable1, player.address)).toEqual(1000);
  expect<number>(await getBalance(consumable2, player.address)).toEqual(1000);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, player.address, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, player.address, constrainedSkill.address)).toEqual(0);
  expect<number>(await getItemUsesLeft(artifact1, '1')).toEqual(1);
  expect<number>(await getItemUsesLeft(artifact2, '1')).toEqual(1);
  expect<number>(await getItemUsesLeft(artifact2, '2')).toEqual(1);

  await expectRevert(
    player.acquireNext(constrainedSkill.address, [item1], [{ consumable: consumable1.address, amount: 100 }], {
      from: PLAYER_ADMIN,
    }),
    'Not enough consumable to transfer',
  );

  expect<number>(await getSkilllevel(constrainedSkill, player.address)).toEqual(0);

  expect<number>(await getBalance(consumable1, player.address)).toEqual(1000);
  expect<number>(await getBalance(consumable2, player.address)).toEqual(1000);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, player.address, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, player.address, constrainedSkill.address)).toEqual(0);
  expect<number>(await getItemUsesLeft(artifact1, '1')).toEqual(1);
  expect<number>(await getItemUsesLeft(artifact2, '1')).toEqual(1);
  expect<number>(await getItemUsesLeft(artifact2, '2')).toEqual(1);
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

  await player.acquireNext(basicSkill1.address, [], [], { from: PLAYER_ADMIN });
  await player.acquireNext(basicSkill2.address, [], [], { from: PLAYER_ADMIN });
  await player.acquireNext(basicSkill2.address, [], [], { from: PLAYER_ADMIN });

  await expectRevert(
    player.acquireNext(
      constrainedSkill.address,
      [item1, item2, item3],
      [{ consumable: consumable1.address, amount: 10000 }],
      { from: PLAYER_ADMIN },
    ),
    'transfer amount exceeds balance',
  );

  expect<number>(await getSkilllevel(constrainedSkill, player.address)).toEqual(0);

  expect<number>(await getBalance(consumable1, player.address)).toEqual(1000);
  expect<number>(await getBalance(consumable2, player.address)).toEqual(1000);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, player.address, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, player.address, constrainedSkill.address)).toEqual(0);
  expect<number>(await getItemUsesLeft(artifact1, '1')).toEqual(1);
  expect<number>(await getItemUsesLeft(artifact2, '1')).toEqual(1);
  expect<number>(await getItemUsesLeft(artifact2, '2')).toEqual(1);
});

it('should revert when skill address is not a skill', async () => {
  const player = await createPlayer();

  const notASkill = await createConsumable({ name: 'Not a skill' });

  await expectRevert(
    player.acquireNext(notASkill.address, [], [], { from: PLAYER_ADMIN }),
    'skill address must support ISkill',
  );
});

it('should revert when any item is not an artifact', async () => {
  const player = await createPlayer();

  const skill = await createSkill({ name: 'Skill' });

  const artifact = await createArtifact({ name: 'Artifact' });

  await mintItem(artifact, player.address);

  const notAnArtifact = await createConsumable({ name: 'Not an artifact' });

  await expectRevert(
    player.acquireNext(
      skill.address,
      [
        { artifact: artifact.address, itemId: 1 },
        { artifact: notAnArtifact.address, itemId: 1 },
      ],
      [],
      { from: PLAYER_ADMIN },
    ),
    'item address must support IArtifact',
  );
});

it('should revert when any item is not owned by the player', async () => {
  const player = await createPlayer();

  const skill = await createSkill({ name: 'Skill' });

  const artifact1 = await createArtifact({ name: 'Artifact 1' });
  await mintItem(artifact1, player.address);

  const artifact2 = await createArtifact({ name: 'Artifact 2' });
  await mintItem(artifact2, PLAYER1);

  await expectRevert(
    player.acquireNext(
      skill.address,
      [
        { artifact: artifact1.address, itemId: 1 },
        { artifact: artifact2.address, itemId: 1 },
      ],
      [],
      { from: PLAYER_ADMIN },
    ),
    'must be used by the owner',
  );

  await expectRevert(
    player.acquireNext(
      skill.address,
      [
        { artifact: artifact1.address, itemId: 1 },
        { artifact: artifact2.address, itemId: 2 },
      ],
      [],
      { from: PLAYER_ADMIN },
    ),
    'owner query for nonexistent token',
  );
});

it('should revert when called with non-consumables to provide', async () => {
  const player = await createPlayer();

  const skill = await createSkill({ name: 'Skill' });

  const consumable = await createConsumable({ name: 'Consumable' });
  const notAConsumable = await createArtifact({ name: 'Not a consumable' });

  await mintConsumable(consumable, player.address, 1000);

  await expectRevert(
    player.acquireNext(
      skill.address,
      [],
      [
        { consumable: consumable.address, amount: 100 },
        { consumable: notAConsumable.address, amount: 200 },
      ],
      { from: PLAYER_ADMIN },
    ),
    'Consumable must support interface when providing',
  );
});

it('should revert when not called by owner', async () => {
  const player = await createPlayer();

  const skill = await createSkill({ name: 'Skill' });

  await expectRevert(
    player.acquireNext(skill.address, [], [], { from: PLAYER1 }),
    'Caller does not have the Admin role',
  );
});

it('should not acquire the skill if disabled', async () => {
  const player = await createPlayer();

  const skill = await createSkill({ name: 'Skill 1' });

  await disableContract(player, PLAYER_ADMIN);

  await expectRevert(player.acquireNext(skill.address, [], [], { from: PLAYER_ADMIN }), 'Contract is disabled');
});
