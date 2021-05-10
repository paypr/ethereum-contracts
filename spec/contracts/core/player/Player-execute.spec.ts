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
import { createActivity } from '../../../helpers/ActivityHelper';
import { createArtifact, mintItem } from '../../../helpers/ArtifactHelper';
import { burnConsumable, createConsumable, mintConsumable } from '../../../helpers/ConsumableHelper';
import { disableContract } from '../../../helpers/DisableableHelper';
import { createPlayer, executeActivity } from '../../../helpers/PlayerHelper';

it('should execute the activity', async () => {
  const player = await createPlayer();

  const activity = await createActivity();

  await executeActivity(player, activity.address);
  expect<BigNumber>(await activity.executed(player.address)).toEqBN(1);
  expect<BigNumber>(await activity.totalExecuted()).toEqBN(1);

  await expect<ContractTransaction>(await executeActivity(player, activity.address)).toHaveEmittedWith(
    activity,
    'Executed',
    [player.address],
  );
});

it('should use the items', async () => {
  const player = await createPlayer();

  const artifact1 = await createArtifact({ name: 'Artifact 1' });
  await mintItem(artifact1, player.address);
  const item1: Item = { artifact: artifact1.address, itemId: '1' };

  const artifact2 = await createArtifact({ name: 'Artifact 2' });
  await mintItem(artifact2, player.address);
  const item2: Item = { artifact: artifact2.address, itemId: '1' };
  await mintItem(artifact2, player.address);
  const item3: Item = { artifact: artifact2.address, itemId: '2' };

  const activity = await createActivity();

  await executeActivity(player, activity.address, [item1, item2, item3]);

  expect<BigNumber>(await artifact1.usesLeft(item1.itemId)).toEqBN(0);
  expect<BigNumber>(await artifact2.usesLeft(item2.itemId)).toEqBN(0);
  expect<BigNumber>(await artifact2.usesLeft(item3.itemId)).toEqBN(0);
});

it('should provide the activity with consumables', async () => {
  const player = await createPlayer();

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  await mintConsumable(consumable1, player.address, 1000);
  await mintConsumable(consumable2, player.address, 1000);

  const artifact1 = await createArtifact(
    { name: 'Artifact 1' },
    '',
    '',
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    2,
  );
  await mintConsumable(consumable1, artifact1.address, 1000);
  await mintConsumable(consumable2, artifact1.address, 1000);
  await mintItem(artifact1, player.address);
  const item1: Item = { artifact: artifact1.address, itemId: '1' };

  const artifact2 = await createArtifact(
    { name: 'Artifact 2' },
    '',
    '',
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    2,
  );
  await mintConsumable(consumable1, artifact2.address, 1000);
  await mintConsumable(consumable2, artifact2.address, 1000);
  await mintItem(artifact2, player.address);
  const item2: Item = { artifact: artifact2.address, itemId: '1' };
  await mintItem(artifact2, player.address);
  const item3: Item = { artifact: artifact2.address, itemId: '2' };

  const activity = await createActivity({}, [
    { consumable: consumable1.address, amount: 300 },
    { consumable: consumable2.address, amount: 500 },
  ]);

  await executeActivity(
    player,
    activity.address,
    [item1, item2],
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 100 },
    ],
  );

  expect<BigNumber>(await consumable1.balanceOf(artifact1.address)).toEqBN(900);
  expect<BigNumber>(await consumable2.balanceOf(artifact1.address)).toEqBN(800);

  expect<BigNumber>(await consumable1.balanceOf(artifact2.address)).toEqBN(900);
  expect<BigNumber>(await consumable2.balanceOf(artifact2.address)).toEqBN(800);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(900);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(900);

  await executeActivity(player, activity.address, [item1, item2, item3]);

  expect<BigNumber>(await consumable1.balanceOf(artifact1.address)).toEqBN(800);
  expect<BigNumber>(await consumable2.balanceOf(artifact1.address)).toEqBN(600);

  expect<BigNumber>(await consumable1.balanceOf(artifact2.address)).toEqBN(700);
  expect<BigNumber>(await consumable2.balanceOf(artifact2.address)).toEqBN(400);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(900);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(900);
});

it('should consume consumables from the activity', async () => {
  const player = await createPlayer();

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });
  const consumable3 = await createConsumable({ name: 'Consumable 3' });

  await mintConsumable(consumable1, player.address, 1000);
  await mintConsumable(consumable2, player.address, 1000);

  const artifact1 = await createArtifact({ name: 'Artifact 1' }, '', '', [
    { consumable: consumable1.address, amount: 90 },
    { consumable: consumable2.address, amount: 50 },
  ]);
  await mintConsumable(consumable1, artifact1.address, 1000);
  await mintConsumable(consumable2, artifact1.address, 1000);
  await mintItem(artifact1, player.address);
  const item1: Item = { artifact: artifact1.address, itemId: '1' };

  const artifact2 = await createArtifact({ name: 'Artifact 2' }, '', '', [
    { consumable: consumable2.address, amount: 50 },
  ]);
  await mintConsumable(consumable1, artifact2.address, 1000);
  await mintConsumable(consumable2, artifact2.address, 1000);
  await mintItem(artifact2, player.address);
  const item2: Item = { artifact: artifact2.address, itemId: '1' };
  await mintItem(artifact2, player.address);
  const item3: Item = { artifact: artifact2.address, itemId: '2' };

  const activity = await createActivity(
    {},
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ],
    [
      { consumable: consumable2.address, amount: 50 },
      { consumable: consumable3.address, amount: 100 },
    ],
  );

  await mintConsumable(consumable3, activity.address, 1000);

  await executeActivity(
    player,
    activity.address,
    [item1, item2, item3],
    [
      { consumable: consumable1.address, amount: 10 },
      { consumable: consumable2.address, amount: 50 },
    ],
    [
      { consumable: consumable2.address, amount: 50 },
      { consumable: consumable3.address, amount: 100 },
    ],
  );

  expect<BigNumber>(await artifact1.usesLeft(item1.itemId)).toEqBN(0);
  expect<BigNumber>(await artifact2.usesLeft(item2.itemId)).toEqBN(0);
  expect<BigNumber>(await artifact2.usesLeft(item3.itemId)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(990);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable3.balanceOf(player.address)).toEqBN(100);

  expect<BigNumber>(await consumable1.allowance(player.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(artifact1.address)).toEqBN(910);
  expect<BigNumber>(await consumable2.balanceOf(artifact1.address)).toEqBN(950);

  expect<BigNumber>(await consumable1.allowance(artifact1.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact1.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(artifact2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact2.address)).toEqBN(900);

  expect<BigNumber>(await consumable1.allowance(artifact2.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact2.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(activity.address)).toEqBN(100);
  expect<BigNumber>(await consumable2.balanceOf(activity.address)).toEqBN(150);
  expect<BigNumber>(await consumable3.balanceOf(activity.address)).toEqBN(900);
});

it('should not use the items or provide any consumables if not enough uses left of any items', async () => {
  const player = await createPlayer();

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  await mintConsumable(consumable1, player.address, 1000);
  await mintConsumable(consumable2, player.address, 1000);

  const artifact1 = await createArtifact({ name: 'Artifact 1' }, '', '', [
    { consumable: consumable1.address, amount: 100 },
    { consumable: consumable2.address, amount: 200 },
  ]);
  await mintConsumable(consumable1, artifact1.address, 1000);
  await mintConsumable(consumable2, artifact1.address, 1000);
  await mintItem(artifact1, player.address);
  const item1: Item = { artifact: artifact1.address, itemId: '1' };

  const artifact2 = await createArtifact({ name: 'Artifact 2' }, '', '', [
    { consumable: consumable1.address, amount: 100 },
    { consumable: consumable2.address, amount: 200 },
  ]);
  await mintConsumable(consumable1, artifact2.address, 1000);
  await mintConsumable(consumable2, artifact2.address, 1000);
  await mintItem(artifact2, player.address);
  const item2: Item = { artifact: artifact2.address, itemId: '1' };
  await mintItem(artifact2, player.address);
  const item3: Item = { artifact: artifact2.address, itemId: '2' };

  const activity = await createActivity({}, [
    { consumable: consumable1.address, amount: 100 },
    { consumable: consumable2.address, amount: 200 },
  ]);

  await executeActivity(player, activity.address, [item2]);

  await expect<Promise<ContractTransaction>>(
    executeActivity(
      player,
      activity.address,
      [item1, item2, item3],
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
    ),
  ).toBeRevertedWith('no uses left for item');

  expect<BigNumber>(await artifact1.usesLeft(item1.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item2.itemId)).toEqBN(0);
  expect<BigNumber>(await artifact2.usesLeft(item3.itemId)).toEqBN(1);

  expect<BigNumber>(await consumable1.balanceOf(artifact1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact1.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact1.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact1.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(artifact2.address)).toEqBN(900);
  expect<BigNumber>(await consumable2.balanceOf(artifact2.address)).toEqBN(800);

  expect<BigNumber>(await consumable1.allowance(artifact2.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact2.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(player.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, activity.address)).toEqBN(0);
});

it('should not use the items or provide any consumables if not enough of any consumables to provide', async () => {
  const player = await createPlayer();

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  await mintConsumable(consumable1, player.address, 1000);
  await mintConsumable(consumable2, player.address, 1000);

  const artifact1 = await createArtifact({ name: 'Artifact 1' }, '', '', [
    { consumable: consumable1.address, amount: 100 },
    { consumable: consumable2.address, amount: 200 },
  ]);
  await mintConsumable(consumable1, artifact1.address, 1000);
  await mintConsumable(consumable2, artifact1.address, 1000);
  await mintItem(artifact1, player.address);
  const item1: Item = { artifact: artifact1.address, itemId: '1' };

  const artifact2 = await createArtifact({ name: 'Artifact 2' }, '', '', [
    { consumable: consumable1.address, amount: 100 },
    { consumable: consumable2.address, amount: 200 },
  ]);
  await mintConsumable(consumable1, artifact2.address, 1000);
  await mintConsumable(consumable2, artifact2.address, 1000);
  await mintItem(artifact2, player.address);
  const item2: Item = { artifact: artifact2.address, itemId: '1' };
  await mintItem(artifact2, player.address);
  const item3: Item = { artifact: artifact2.address, itemId: '2' };

  const activity = await createActivity({}, [
    { consumable: consumable1.address, amount: 300 },
    { consumable: consumable2.address, amount: 700 },
  ]);

  await mintConsumable(consumable1, activity.address, 1000);
  await mintConsumable(consumable2, activity.address, 1000);

  await expect<Promise<ContractTransaction>>(
    executeActivity(player, activity.address, [item1, item2]),
  ).toBeRevertedWith('Not enough consumable to transfer');

  expect<BigNumber>(await artifact1.usesLeft(item1.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item2.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item3.itemId)).toEqBN(1);

  expect<BigNumber>(await consumable1.balanceOf(artifact1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact1.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact1.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact1.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(artifact2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact2.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact2.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact2.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(player.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, activity.address)).toEqBN(0);

  await expect<Promise<ContractTransaction>>(
    executeActivity(player, activity.address, [item1, item2, item3]),
  ).toBeRevertedWith('Not enough consumable to transfer');

  expect<BigNumber>(await artifact1.usesLeft(item1.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item2.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item3.itemId)).toEqBN(1);

  expect<BigNumber>(await consumable1.balanceOf(artifact1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact1.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact1.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact1.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(artifact2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact2.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact2.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact2.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(player.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, activity.address)).toEqBN(0);
});

// tslint:disable-next-line:max-line-length
it('should not use the items or provide any consumables if player does not transfer enough any consumables', async () => {
  const player = await createPlayer();

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  await mintConsumable(consumable1, player.address, 1000);
  await mintConsumable(consumable2, player.address, 1000);

  const artifact1 = await createArtifact({ name: 'Artifact 1' }, '', '', [
    { consumable: consumable1.address, amount: 100 },
    { consumable: consumable2.address, amount: 200 },
  ]);
  await mintConsumable(consumable1, artifact1.address, 1000);
  await mintConsumable(consumable2, artifact1.address, 1000);
  await mintItem(artifact1, player.address);
  const item1: Item = { artifact: artifact1.address, itemId: '1' };

  const artifact2 = await createArtifact({ name: 'Artifact 2' }, '', '', [
    { consumable: consumable1.address, amount: 100 },
    { consumable: consumable2.address, amount: 200 },
  ]);
  await mintConsumable(consumable1, artifact2.address, 1000);
  await mintConsumable(consumable2, artifact2.address, 1000);
  await mintItem(artifact2, player.address);
  const item2: Item = { artifact: artifact2.address, itemId: '1' };
  await mintItem(artifact2, player.address);
  const item3: Item = { artifact: artifact2.address, itemId: '2' };

  const activity = await createActivity({}, [
    { consumable: consumable1.address, amount: 300 },
    { consumable: consumable2.address, amount: 700 },
  ]);

  await mintConsumable(consumable1, activity.address, 1000);
  await mintConsumable(consumable2, activity.address, 1000);

  await expect<Promise<ContractTransaction>>(
    executeActivity(
      player,
      activity.address,
      [item1, item2],
      [
        { consumable: consumable1.address, amount: 99 },
        { consumable: consumable2.address, amount: 100 },
      ],
    ),
  ).toBeRevertedWith('Not enough consumable to transfer');

  expect<BigNumber>(await artifact1.usesLeft(item1.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item2.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item3.itemId)).toEqBN(1);

  expect<BigNumber>(await consumable1.balanceOf(artifact1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact1.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact1.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact1.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(artifact2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact2.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact2.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact2.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(player.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, activity.address)).toEqBN(0);

  await expect<Promise<ContractTransaction>>(
    executeActivity(
      player,
      activity.address,
      [item1, item2],
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 99 },
      ],
    ),
  ).toBeRevertedWith('Not enough consumable to transfer');

  expect<BigNumber>(await artifact1.usesLeft(item1.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item2.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item3.itemId)).toEqBN(1);

  expect<BigNumber>(await consumable1.balanceOf(artifact1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact1.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact1.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact1.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(artifact2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact2.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact2.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact2.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(player.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, activity.address)).toEqBN(0);
});

// tslint:disable-next-line:max-line-length
it('should not use the items or provide any consumables if player does not have enough of any consumables to transfer', async () => {
  const player = await createPlayer();

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  await mintConsumable(consumable1, player.address, 1000);
  await mintConsumable(consumable2, player.address, 1000);

  const artifact1 = await createArtifact({ name: 'Artifact 1' }, '', '', [
    { consumable: consumable1.address, amount: 100 },
    { consumable: consumable2.address, amount: 200 },
  ]);
  await mintConsumable(consumable1, artifact1.address, 1000);
  await mintConsumable(consumable2, artifact1.address, 1000);
  await mintItem(artifact1, player.address);
  const item1: Item = { artifact: artifact1.address, itemId: '1' };

  const artifact2 = await createArtifact({ name: 'Artifact 2' }, '', '', [
    { consumable: consumable1.address, amount: 100 },
    { consumable: consumable2.address, amount: 200 },
  ]);
  await mintConsumable(consumable1, artifact2.address, 1000);
  await mintConsumable(consumable2, artifact2.address, 1000);
  await mintItem(artifact2, player.address);
  const item2: Item = { artifact: artifact2.address, itemId: '1' };
  await mintItem(artifact2, player.address);
  const item3: Item = { artifact: artifact2.address, itemId: '2' };

  const activity = await createActivity({}, [
    { consumable: consumable1.address, amount: 300 },
    { consumable: consumable2.address, amount: 700 },
  ]);

  await mintConsumable(consumable1, activity.address, 1000);
  await mintConsumable(consumable2, activity.address, 1000);

  await expect<Promise<ContractTransaction>>(
    executeActivity(
      player,
      activity.address,
      [item1, item2],
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 10000 },
      ],
    ),
  ).toBeRevertedWith('transfer amount exceeds balance');

  expect<BigNumber>(await artifact1.usesLeft(item1.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item2.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item3.itemId)).toEqBN(1);

  expect<BigNumber>(await consumable1.balanceOf(artifact1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact1.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact1.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact1.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(artifact2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact2.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact2.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact2.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(player.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, activity.address)).toEqBN(0);

  await expect<Promise<ContractTransaction>>(
    executeActivity(
      player,
      activity.address,
      [item1, item2],
      [
        { consumable: consumable1.address, amount: 10000 },
        { consumable: consumable2.address, amount: 100 },
      ],
    ),
  ).toBeRevertedWith('transfer amount exceeds balance');

  expect<BigNumber>(await artifact1.usesLeft(item1.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item2.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item3.itemId)).toEqBN(1);

  expect<BigNumber>(await consumable1.balanceOf(artifact1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact1.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact1.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact1.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(artifact2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact2.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact2.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact2.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(player.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, activity.address)).toEqBN(0);
});

// tslint:disable-next-line:max-line-length
it('should not use the items or provide any consumables if artifact does not have enough of any consumables to transfer', async () => {
  const player = await createPlayer();

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  await mintConsumable(consumable1, player.address, 1000);
  await mintConsumable(consumable2, player.address, 1000);

  const artifact1 = await createArtifact({ name: 'Artifact 1' }, '', '', [
    { consumable: consumable1.address, amount: 100 },
    { consumable: consumable2.address, amount: 200 },
  ]);
  await mintConsumable(consumable1, artifact1.address, 1000);
  await mintConsumable(consumable2, artifact1.address, 1000);
  await mintItem(artifact1, player.address);
  const item1: Item = { artifact: artifact1.address, itemId: '1' };

  const artifact2 = await createArtifact({ name: 'Artifact 2' }, '', '', [
    { consumable: consumable1.address, amount: 100 },
    { consumable: consumable2.address, amount: 200 },
  ]);
  await mintConsumable(consumable1, artifact2.address, 1000);
  await mintConsumable(consumable2, artifact2.address, 1000);
  await mintItem(artifact2, player.address);
  const item2: Item = { artifact: artifact2.address, itemId: '1' };
  await mintItem(artifact2, player.address);
  const item3: Item = { artifact: artifact2.address, itemId: '2' };

  const activity = await createActivity({}, [
    { consumable: consumable1.address, amount: 300 },
    { consumable: consumable2.address, amount: 700 },
  ]);

  await mintConsumable(consumable1, activity.address, 1000);

  await expect<Promise<ContractTransaction>>(
    executeActivity(player, activity.address, [item1, item2, item3]),
  ).toBeRevertedWith('Not enough consumable to transfer');

  expect<BigNumber>(await artifact1.usesLeft(item1.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item2.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item3.itemId)).toEqBN(1);

  expect<BigNumber>(await consumable1.balanceOf(artifact1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact1.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact1.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact1.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(artifact2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact2.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact2.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact2.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(player.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, activity.address)).toEqBN(0);

  await burnConsumable(consumable1, activity.address, 1000);
  await mintConsumable(consumable2, activity.address, 1000);

  await expect<Promise<ContractTransaction>>(
    executeActivity(player, activity.address, [item1, item2, item3]),
  ).toBeRevertedWith('Not enough consumable to transfer');

  expect<BigNumber>(await artifact1.usesLeft(item1.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item2.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item3.itemId)).toEqBN(1);

  expect<BigNumber>(await consumable1.balanceOf(artifact1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact1.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact1.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact1.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(artifact2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact2.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact2.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact2.address, activity.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(player.address, activity.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, activity.address)).toEqBN(0);
});

it('should not use the items or provide any consumables if did not receive enough consumables', async () => {
  const player = await createPlayer();

  const consumable1 = await createConsumable({ name: 'Consumable 1' });
  const consumable2 = await createConsumable({ name: 'Consumable 2' });

  await mintConsumable(consumable1, player.address, 1000);
  await mintConsumable(consumable2, player.address, 1000);

  const artifact1 = await createArtifact({ name: 'Artifact 1' }, '', '', [
    { consumable: consumable1.address, amount: 100 },
    { consumable: consumable2.address, amount: 200 },
  ]);
  await mintConsumable(consumable1, artifact1.address, 1000);
  await mintConsumable(consumable2, artifact1.address, 1000);
  await mintItem(artifact1, player.address);
  const item1: Item = { artifact: artifact1.address, itemId: '1' };

  const artifact2 = await createArtifact({ name: 'Artifact 2' }, '', '', [
    { consumable: consumable1.address, amount: 100 },
    { consumable: consumable2.address, amount: 200 },
  ]);
  await mintConsumable(consumable1, artifact2.address, 1000);
  await mintConsumable(consumable2, artifact2.address, 1000);
  await mintItem(artifact2, player.address);
  const item2: Item = { artifact: artifact2.address, itemId: '1' };
  await mintItem(artifact2, player.address);
  const item3: Item = { artifact: artifact2.address, itemId: '2' };

  const activity1 = await createActivity(
    {},
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable1.address, amount: 200 },
    ],
    [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable1.address, amount: 200 },
    ],
  );

  await mintConsumable(consumable1, activity1.address, 1000);
  await mintConsumable(consumable2, activity1.address, 1000);

  await expect<Promise<ContractTransaction>>(
    executeActivity(
      player,
      activity1.address,
      [item1, item2, item3],
      [],
      [
        { consumable: consumable1.address, amount: 101 },
        { consumable: consumable2.address, amount: 199 },
      ],
    ),
  ).toBeRevertedWith('Not enough consumable to transfer');

  expect<BigNumber>(await artifact1.usesLeft(item1.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item2.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item3.itemId)).toEqBN(1);

  expect<BigNumber>(await consumable1.balanceOf(artifact1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact1.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact1.address, activity1.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact1.address, activity1.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(artifact2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact2.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact2.address, activity1.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact2.address, activity1.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(player.address, activity1.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, activity1.address)).toEqBN(0);

  await expect<Promise<ContractTransaction>>(
    executeActivity(
      player,
      activity1.address,
      [item1, item2, item3],
      [],
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 201 },
      ],
    ),
  ).toBeRevertedWith('Not enough consumable to transfer');

  expect<BigNumber>(await artifact1.usesLeft(item1.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item2.itemId)).toEqBN(1);
  expect<BigNumber>(await artifact2.usesLeft(item3.itemId)).toEqBN(1);

  expect<BigNumber>(await consumable1.balanceOf(artifact1.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact1.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact1.address, activity1.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact1.address, activity1.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(artifact2.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(artifact2.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(artifact2.address, activity1.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(artifact2.address, activity1.address)).toEqBN(0);

  expect<BigNumber>(await consumable1.balanceOf(player.address)).toEqBN(1000);
  expect<BigNumber>(await consumable2.balanceOf(player.address)).toEqBN(1000);

  expect<BigNumber>(await consumable1.allowance(player.address, activity1.address)).toEqBN(0);
  expect<BigNumber>(await consumable2.allowance(player.address, activity1.address)).toEqBN(0);
});

it('should revert when activity address is not an activity', async () => {
  const player = await createPlayer();

  const notAnActivity = await createConsumable({ name: 'Not an activity' });

  await expect<Promise<ContractTransaction>>(
    executeActivity(player, notAnActivity.address, [], [], []),
  ).toBeRevertedWith('activity address must support IActivity');
});

it('should revert when any item is not an artifact', async () => {
  const player = await createPlayer();

  const activity = await createActivity({ name: 'Activity' });

  const artifact = await createArtifact({ name: 'Artifact' });

  await mintItem(artifact, player.address);

  const notAnArtifact = await createConsumable({ name: 'Not an artifact' });

  await expect<Promise<ContractTransaction>>(
    executeActivity(
      player,
      activity.address,
      [
        { artifact: artifact.address, itemId: '1' },
        { artifact: notAnArtifact.address, itemId: '1' },
      ],
      [],
      [],
    ),
  ).toBeRevertedWith('item address must support IArtifact');
});

it('should revert when any item is not owned by the player', async () => {
  const player = await createPlayer();

  const activity = await createActivity({ name: 'Activity' });

  const artifact1 = await createArtifact({ name: 'Artifact 1' });
  await mintItem(artifact1, player.address);

  const artifact2 = await createArtifact({ name: 'Artifact 2' });
  await mintItem(artifact2, PLAYER1.address);

  await expect<Promise<ContractTransaction>>(
    executeActivity(
      player,
      activity.address,
      [
        { artifact: artifact1.address, itemId: '1' },
        { artifact: artifact2.address, itemId: '1' },
      ],
      [],
      [],
    ),
  ).toBeRevertedWith('must be used by the owner');

  await expect<Promise<ContractTransaction>>(
    executeActivity(
      player,
      activity.address,
      [
        { artifact: artifact1.address, itemId: '1' },
        { artifact: artifact2.address, itemId: '2' },
      ],
      [],
      [],
    ),
  ).toBeRevertedWith('owner query for nonexistent token');
});

it('should revert when called with non-consumables to provide', async () => {
  const player = await createPlayer();

  const activity = await createActivity({ name: 'Activity' });

  const consumable = await createConsumable({ name: 'Consumable' });
  const notAConsumable = await createArtifact({ name: 'Not a consumable' });

  await mintConsumable(consumable, player.address, 1000);

  await expect<Promise<ContractTransaction>>(
    executeActivity(
      player,
      activity.address,
      [],
      [
        { consumable: consumable.address, amount: 100 },
        { consumable: notAConsumable.address, amount: 200 },
      ],
      [],
    ),
  ).toBeRevertedWith('Consumable must support interface when providing');
});

it('should revert when called with non-consumables to consume', async () => {
  const player = await createPlayer();

  const consumable = await createConsumable({ name: 'Consumable' });
  const notAConsumable = await createArtifact({ name: 'Not a consumable' });

  const activity = await createActivity({ name: 'Activity' }, [], [{ consumable: consumable.address, amount: 100 }]);

  await mintConsumable(consumable, activity.address, 1000);

  await expect<Promise<ContractTransaction>>(
    executeActivity(
      player,
      activity.address,
      [],
      [],
      [
        { consumable: consumable.address, amount: 100 },
        { consumable: notAConsumable.address, amount: 200 },
      ],
    ),
  ).toBeRevertedWith('Consumable must support interface when consuming');
});

it('should revert when not called by owner', async () => {
  const player = await createPlayer();

  const activity = await createActivity({ name: 'Activity' });

  await expect<Promise<ContractTransaction>>(
    player.connect(PLAYER1).execute(activity.address, [], [], []),
  ).toBeRevertedWith('Caller does not have the Admin role');
});

it('should not execute the activity if disabled', async () => {
  const player = await createPlayer();

  const activity = await createActivity();

  await disableContract(player, PLAYER_ADMIN);

  await expect<Promise<ContractTransaction>>(executeActivity(player, activity.address)).toBeRevertedWith(
    'Contract is disabled',
  );
});
