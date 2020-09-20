import { BN, expectEvent, expectRevert } from '@openzeppelin/test-helpers';
import { createConstrainedSkill, createSkill, getSkilllevel } from '../../../helpers/SkillHelper';
import { PLAYER1, PLAYER2, HELPER1, HELPER2 } from '../../../helpers/Accounts';
import { createConsumable, getAllowance, getBalance, mintConsumable } from '../../../helpers/ConsumableHelper';

it('should get the first level when no levels found', async () => {
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

  await basicSkill1.acquireNext([], { from: PLAYER1 });
  await basicSkill2.acquireNext([], { from: PLAYER1 });
  await basicSkill2.acquireNext([], { from: PLAYER1 });
  await basicSkill2.acquireNext([], { from: PLAYER2 });

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 200, { from: PLAYER1 });

  await constrainedSkill.acquireNext([], { from: PLAYER1 });

  expect<number>(await getSkilllevel(constrainedSkill, PLAYER1)).toEqual(1);
});

it('should send Acquired event when no levels found', async () => {
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

  await basicSkill1.acquireNext([], { from: PLAYER1 });
  await basicSkill2.acquireNext([], { from: PLAYER1 });
  await basicSkill2.acquireNext([], { from: PLAYER1 });
  await basicSkill2.acquireNext([], { from: PLAYER2 });

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 200, { from: PLAYER1 });

  expectEvent(await constrainedSkill.acquireNext([], { from: PLAYER1 }), 'Acquired', {
    player: PLAYER1,
    level: new BN(1),
  });
});

it('should get the first level when no level found for player', async () => {
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

  await basicSkill1.acquireNext([], { from: PLAYER1 });
  await basicSkill2.acquireNext([], { from: PLAYER1 });
  await basicSkill2.acquireNext([], { from: PLAYER1 });

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 200, { from: PLAYER1 });

  await constrainedSkill.acquireNext([], { from: PLAYER1 });

  await basicSkill1.acquireNext([], { from: PLAYER2 });
  await basicSkill2.acquireNext([], { from: PLAYER2 });
  await basicSkill2.acquireNext([], { from: PLAYER2 });

  await mintConsumable(consumable1, PLAYER2, 1000);
  await mintConsumable(consumable2, PLAYER2, 1000);

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER2 });
  await consumable2.increaseAllowance(constrainedSkill.address, 200, { from: PLAYER2 });

  await constrainedSkill.acquireNext([], { from: PLAYER2 });

  expect<number>(await getSkilllevel(constrainedSkill, PLAYER2)).toEqual(1);
});

it('should get the next level when level found for player', async () => {
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

  await basicSkill1.acquireNext([], { from: PLAYER1 });
  await basicSkill2.acquireNext([], { from: PLAYER1 });
  await basicSkill2.acquireNext([], { from: PLAYER1 });

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await basicSkill1.acquireNext([], { from: PLAYER2 });
  await basicSkill2.acquireNext([], { from: PLAYER2 });
  await basicSkill2.acquireNext([], { from: PLAYER2 });

  await mintConsumable(consumable1, PLAYER2, 1000);
  await mintConsumable(consumable2, PLAYER2, 1000);

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 200, { from: PLAYER1 });

  await constrainedSkill.acquireNext([], { from: PLAYER1 });

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 200, { from: PLAYER1 });

  await constrainedSkill.acquireNext([], { from: PLAYER1 });

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER2 });
  await consumable2.increaseAllowance(constrainedSkill.address, 200, { from: PLAYER2 });

  await constrainedSkill.acquireNext([], { from: PLAYER2 });

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 200, { from: PLAYER1 });

  await constrainedSkill.acquireNext([], { from: PLAYER1 });

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER2 });
  await consumable2.increaseAllowance(constrainedSkill.address, 200, { from: PLAYER2 });

  await constrainedSkill.acquireNext([], { from: PLAYER2 });

  expect<number>(await getSkilllevel(constrainedSkill, PLAYER1)).toEqual(3);
  expect<number>(await getSkilllevel(constrainedSkill, PLAYER2)).toEqual(2);
});

it('should get the next level when helpers used by player', async () => {
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

  await basicSkill1.acquireNext([], { from: PLAYER1 });
  await basicSkill2.acquireNext([], { from: PLAYER1 });
  await basicSkill2.acquireNext([], { from: PLAYER1 });

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await mintConsumable(consumable1, HELPER1, 1000);
  await mintConsumable(consumable2, HELPER1, 1000);

  await mintConsumable(consumable1, HELPER2, 1000);
  await mintConsumable(consumable2, HELPER2, 1000);

  await basicSkill1.acquireNext([], { from: PLAYER2 });
  await basicSkill2.acquireNext([], { from: PLAYER2 });
  await basicSkill2.acquireNext([], { from: PLAYER2 });

  await mintConsumable(consumable1, PLAYER2, 1000);
  await mintConsumable(consumable2, PLAYER2, 1000);

  await consumable1.increaseAllowance(constrainedSkill.address, 50, { from: PLAYER1 });
  await consumable1.increaseAllowance(constrainedSkill.address, 50, { from: HELPER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 100, { from: HELPER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 100, { from: HELPER2 });

  await constrainedSkill.acquireNext([HELPER1, HELPER2], { from: PLAYER1 });

  await consumable1.increaseAllowance(constrainedSkill.address, 50, { from: PLAYER1 });
  await consumable1.increaseAllowance(constrainedSkill.address, 50, { from: HELPER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 100, { from: HELPER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 100, { from: HELPER2 });

  await constrainedSkill.acquireNext([HELPER1, HELPER2], { from: PLAYER1 });

  await consumable1.increaseAllowance(constrainedSkill.address, 50, { from: PLAYER2 });
  await consumable1.increaseAllowance(constrainedSkill.address, 50, { from: HELPER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 100, { from: HELPER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 100, { from: HELPER2 });

  await constrainedSkill.acquireNext([HELPER1, HELPER2], { from: PLAYER2 });

  await consumable1.increaseAllowance(constrainedSkill.address, 50, { from: PLAYER1 });
  await consumable1.increaseAllowance(constrainedSkill.address, 50, { from: HELPER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 100, { from: HELPER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 100, { from: HELPER2 });

  await constrainedSkill.acquireNext([HELPER1, HELPER2], { from: PLAYER1 });

  await consumable1.increaseAllowance(constrainedSkill.address, 50, { from: PLAYER2 });
  await consumable1.increaseAllowance(constrainedSkill.address, 50, { from: HELPER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 100, { from: HELPER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 100, { from: HELPER2 });

  await constrainedSkill.acquireNext([HELPER1, HELPER2], { from: PLAYER2 });

  expect<number>(await getSkilllevel(constrainedSkill, PLAYER1)).toEqual(3);
  expect<number>(await getSkilllevel(constrainedSkill, PLAYER2)).toEqual(2);

  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(850);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable1, PLAYER2)).toEqual(900);
  expect<number>(await getBalance(consumable2, PLAYER2)).toEqual(1000);
  expect<number>(await getBalance(consumable1, HELPER1)).toEqual(750);
  expect<number>(await getBalance(consumable2, HELPER1)).toEqual(500);
  expect<number>(await getBalance(consumable1, HELPER2)).toEqual(1000);
  expect<number>(await getBalance(consumable2, HELPER2)).toEqual(500);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(500);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(1000);
  expect<number>(await getAllowance(consumable1, PLAYER1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, PLAYER1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, PLAYER2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, PLAYER2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, HELPER1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, HELPER1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, HELPER2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, HELPER2, constrainedSkill.address)).toEqual(0);
});

it('should send Acquired event for advanced level', async () => {
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

  await basicSkill1.acquireNext([], { from: PLAYER1 });
  await basicSkill2.acquireNext([], { from: PLAYER1 });
  await basicSkill2.acquireNext([], { from: PLAYER1 });

  await basicSkill1.acquireNext([], { from: PLAYER2 });
  await basicSkill2.acquireNext([], { from: PLAYER2 });
  await basicSkill2.acquireNext([], { from: PLAYER2 });

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await mintConsumable(consumable1, PLAYER2, 1000);
  await mintConsumable(consumable2, PLAYER2, 1000);

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 200, { from: PLAYER1 });

  await constrainedSkill.acquireNext([], { from: PLAYER1 });

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 200, { from: PLAYER1 });

  await constrainedSkill.acquireNext([], { from: PLAYER1 });

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER2 });
  await consumable2.increaseAllowance(constrainedSkill.address, 200, { from: PLAYER2 });

  await constrainedSkill.acquireNext([], { from: PLAYER2 });

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 200, { from: PLAYER1 });

  expectEvent(await constrainedSkill.acquireNext([], { from: PLAYER1 }), 'Acquired', {
    player: PLAYER1,
    level: new BN(3),
  });
});

it('should revert when any dependent skill level not found for player', async () => {
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

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 200, { from: PLAYER1 });

  await basicSkill1.acquireNext([], { from: PLAYER2 });
  await basicSkill2.acquireNext([], { from: PLAYER2 });
  await basicSkill2.acquireNext([], { from: PLAYER2 });

  await mintConsumable(consumable1, PLAYER2, 1000);
  await mintConsumable(consumable2, PLAYER2, 1000);

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER2 });
  await consumable2.increaseAllowance(constrainedSkill.address, 200, { from: PLAYER2 });

  await expectRevert(constrainedSkill.acquireNext([], { from: PLAYER1 }), 'missing required skill');

  expect<number>(await getSkilllevel(constrainedSkill, PLAYER1)).toEqual(0);
  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, PLAYER1, constrainedSkill.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, PLAYER1, constrainedSkill.address)).toEqual(200);

  await basicSkill2.acquireNext([], { from: PLAYER1 });

  await expectRevert(constrainedSkill.acquireNext([], { from: PLAYER1 }), 'missing required skill');

  expect<number>(await getSkilllevel(constrainedSkill, PLAYER1)).toEqual(0);
  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, PLAYER1, constrainedSkill.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, PLAYER1, constrainedSkill.address)).toEqual(200);

  await basicSkill1.acquireNext([], { from: PLAYER1 });

  await expectRevert(constrainedSkill.acquireNext([], { from: PLAYER1 }), 'missing required skill');

  expect<number>(await getSkilllevel(constrainedSkill, PLAYER1)).toEqual(0);
  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, PLAYER1, constrainedSkill.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, PLAYER1, constrainedSkill.address)).toEqual(200);

  await basicSkill1.acquireNext([], { from: PLAYER1 });

  await expectRevert(constrainedSkill.acquireNext([], { from: PLAYER1 }), 'missing required skill');

  expect<number>(await getSkilllevel(constrainedSkill, PLAYER1)).toEqual(0);
  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, PLAYER1, constrainedSkill.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, PLAYER1, constrainedSkill.address)).toEqual(200);
});

it('should revert when any consumables not provided by player / helpers', async () => {
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

  await basicSkill1.acquireNext([], { from: PLAYER1 });
  await basicSkill2.acquireNext([], { from: PLAYER1 });
  await basicSkill2.acquireNext([], { from: PLAYER1 });

  await mintConsumable(consumable1, PLAYER1, 1000);
  await mintConsumable(consumable2, PLAYER1, 1000);

  await mintConsumable(consumable1, HELPER1, 1000);
  await mintConsumable(consumable2, HELPER1, 1000);

  await mintConsumable(consumable1, HELPER2, 1000);
  await mintConsumable(consumable2, HELPER2, 1000);

  await basicSkill1.acquireNext([], { from: PLAYER2 });
  await basicSkill2.acquireNext([], { from: PLAYER2 });
  await basicSkill2.acquireNext([], { from: PLAYER2 });

  await mintConsumable(consumable1, PLAYER2, 1000);
  await mintConsumable(consumable2, PLAYER2, 1000);

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER2 });
  await consumable2.increaseAllowance(constrainedSkill.address, 200, { from: PLAYER2 });

  await consumable1.increaseAllowance(constrainedSkill.address, 99, { from: PLAYER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER1 });

  await expectRevert(constrainedSkill.acquireNext([], { from: PLAYER1 }), 'Not enough consumable to transfer');

  expect<number>(await getSkilllevel(constrainedSkill, PLAYER1)).toEqual(0);
  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable1, HELPER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, HELPER1)).toEqual(1000);
  expect<number>(await getBalance(consumable1, HELPER2)).toEqual(1000);
  expect<number>(await getBalance(consumable2, HELPER2)).toEqual(1000);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, PLAYER1, constrainedSkill.address)).toEqual(99);
  expect<number>(await getAllowance(consumable2, PLAYER1, constrainedSkill.address)).toEqual(100);
  expect<number>(await getAllowance(consumable1, HELPER1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, HELPER1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, HELPER2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, HELPER2, constrainedSkill.address)).toEqual(0);

  await consumable1.increaseAllowance(constrainedSkill.address, 1, { from: PLAYER1 });

  await expectRevert(
    constrainedSkill.acquireNext([HELPER1, HELPER2], { from: PLAYER1 }),
    'Not enough consumable to transfer',
  );

  expect<number>(await getSkilllevel(constrainedSkill, PLAYER1)).toEqual(0);
  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable1, HELPER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, HELPER1)).toEqual(1000);
  expect<number>(await getBalance(consumable1, HELPER2)).toEqual(1000);
  expect<number>(await getBalance(consumable2, HELPER2)).toEqual(1000);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, PLAYER1, constrainedSkill.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, PLAYER1, constrainedSkill.address)).toEqual(100);
  expect<number>(await getAllowance(consumable1, HELPER1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, HELPER1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, HELPER2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable2, HELPER2, constrainedSkill.address)).toEqual(0);

  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: PLAYER1 });
  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: HELPER1 });
  await consumable1.increaseAllowance(constrainedSkill.address, 100, { from: HELPER2 });

  await expectRevert(
    constrainedSkill.acquireNext([HELPER1, HELPER2], { from: PLAYER1 }),
    'Not enough consumable to transfer',
  );

  expect<number>(await getSkilllevel(constrainedSkill, PLAYER1)).toEqual(0);
  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable1, HELPER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, HELPER1)).toEqual(1000);
  expect<number>(await getBalance(consumable1, HELPER2)).toEqual(1000);
  expect<number>(await getBalance(consumable2, HELPER2)).toEqual(1000);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, PLAYER1, constrainedSkill.address)).toEqual(200);
  expect<number>(await getAllowance(consumable2, PLAYER1, constrainedSkill.address)).toEqual(100);
  expect<number>(await getAllowance(consumable1, HELPER1, constrainedSkill.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, HELPER1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, HELPER2, constrainedSkill.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, HELPER2, constrainedSkill.address)).toEqual(0);

  await consumable2.increaseAllowance(constrainedSkill.address, 50, { from: HELPER1 });
  await consumable2.increaseAllowance(constrainedSkill.address, 49, { from: HELPER2 });

  await expectRevert(
    constrainedSkill.acquireNext([HELPER1, HELPER2], { from: PLAYER1 }),
    'Not enough consumable to transfer',
  );

  expect<number>(await getSkilllevel(constrainedSkill, PLAYER1)).toEqual(0);
  expect<number>(await getBalance(consumable1, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, PLAYER1)).toEqual(1000);
  expect<number>(await getBalance(consumable1, HELPER1)).toEqual(1000);
  expect<number>(await getBalance(consumable2, HELPER1)).toEqual(1000);
  expect<number>(await getBalance(consumable1, HELPER2)).toEqual(1000);
  expect<number>(await getBalance(consumable2, HELPER2)).toEqual(1000);
  expect<number>(await getBalance(consumable1, constrainedSkill.address)).toEqual(0);
  expect<number>(await getBalance(consumable2, constrainedSkill.address)).toEqual(0);
  expect<number>(await getAllowance(consumable1, PLAYER1, constrainedSkill.address)).toEqual(200);
  expect<number>(await getAllowance(consumable2, PLAYER1, constrainedSkill.address)).toEqual(100);
  expect<number>(await getAllowance(consumable1, HELPER1, constrainedSkill.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, HELPER1, constrainedSkill.address)).toEqual(50);
  expect<number>(await getAllowance(consumable1, HELPER2, constrainedSkill.address)).toEqual(100);
  expect<number>(await getAllowance(consumable2, HELPER2, constrainedSkill.address)).toEqual(49);
});
