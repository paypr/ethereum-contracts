import { expectRevert } from '@openzeppelin/test-helpers';
import { CONSUMABLE_MINTER, PLAYER1, PLAYER2, PLAYER3 } from '../../../helpers/Accounts';
import { createConsumable, mintConsumable } from '../../../helpers/ConsumableHelper';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import { BASE_CONTRACT_ID, CONSUMABLE_ID, ERC165_ID, TRANSFERRING_ID } from '../../../helpers/ContractIds';
import { disableContract } from '../../../helpers/DisableableHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createConsumable, ERC165_ID);
  shouldSupportInterface('BaseContract', createConsumable, BASE_CONTRACT_ID);
  shouldSupportInterface('Consumable', createConsumable, CONSUMABLE_ID);
  shouldSupportInterface('Transfer', createConsumable, TRANSFERRING_ID);
});

describe('myBalance', () => {
  it('should return 0 when no accounts with a balance', async () => {
    const consumable = await createConsumable();

    const balance = await toNumberAsync(consumable.myBalance({ from: PLAYER1 }));
    expect<number>(balance).toEqual(0);
  });

  it('should return 0 for an account with no balance', async () => {
    const consumable = await createConsumable();

    await consumable.mint(PLAYER2, 1000, { from: CONSUMABLE_MINTER });

    const balance = await toNumberAsync(consumable.myBalance({ from: PLAYER1 }));
    expect<number>(balance).toEqual(0);
  });

  it('should return 0 for an account with only an allowance', async () => {
    const consumable = await createConsumable();

    await consumable.mint(PLAYER2, 1000, { from: CONSUMABLE_MINTER });
    await consumable.increaseAllowance(PLAYER1, 500, { from: PLAYER2 });

    const balance = await toNumberAsync(consumable.myBalance({ from: PLAYER1 }));
    expect<number>(balance).toEqual(0);
  });

  it('should return the correct balance for an account with a balance', async () => {
    const consumable = await createConsumable();

    await consumable.mint(PLAYER1, 1000, { from: CONSUMABLE_MINTER });
    await consumable.mint(PLAYER2, 2000, { from: CONSUMABLE_MINTER });
    await consumable.increaseAllowance(PLAYER1, 500, { from: PLAYER2 });

    const balance = await toNumberAsync(consumable.myBalance({ from: PLAYER1 }));
    expect<number>(balance).toEqual(1000);
  });
});

describe('myAllowance', () => {
  it('should return 0 when no accounts with an allowance', async () => {
    const consumable = await createConsumable();

    const balance = await toNumberAsync(consumable.myAllowance(PLAYER2, { from: PLAYER1 }));
    expect<number>(balance).toEqual(0);
  });

  it('should return 0 for an account with no allowance', async () => {
    const consumable = await createConsumable();

    await consumable.mint(PLAYER2, 1000, { from: CONSUMABLE_MINTER });
    await consumable.increaseAllowance(PLAYER3, 500, { from: PLAYER2 });

    const balance = await toNumberAsync(consumable.myAllowance(PLAYER2, { from: PLAYER1 }));
    expect<number>(balance).toEqual(0);
  });

  it('should return 0 for an account with no allowance from the player', async () => {
    const consumable = await createConsumable();

    await consumable.mint(PLAYER2, 1000, { from: CONSUMABLE_MINTER });
    await consumable.increaseAllowance(PLAYER1, 500, { from: PLAYER2 });

    const balance = await toNumberAsync(consumable.myAllowance(PLAYER3, { from: PLAYER1 }));
    expect<number>(balance).toEqual(0);
  });

  it('should return 0 for an account with only a balance', async () => {
    const consumable = await createConsumable();

    await consumable.mint(PLAYER1, 1000, { from: CONSUMABLE_MINTER });
    await consumable.increaseAllowance(PLAYER2, 500, { from: PLAYER1 });

    const balance = await toNumberAsync(consumable.myAllowance(PLAYER2, { from: PLAYER1 }));
    expect<number>(balance).toEqual(0);
  });

  it('should return the correct balance for an account with an allowance', async () => {
    const consumable = await createConsumable();

    await consumable.mint(PLAYER1, 1000, { from: CONSUMABLE_MINTER });
    await consumable.mint(PLAYER2, 2000, { from: CONSUMABLE_MINTER });
    await consumable.increaseAllowance(PLAYER1, 500, { from: PLAYER2 });
    await consumable.increaseAllowance(PLAYER3, 1000, { from: PLAYER2 });

    const balance = await toNumberAsync(consumable.myAllowance(PLAYER2, { from: PLAYER1 }));
    expect<number>(balance).toEqual(500);
  });
});

describe('decimals', () => {
  it('should return 18', async () => {
    const consumable = await createConsumable();

    expect<number>(await toNumberAsync(consumable.decimals())).toEqual(18);
  });
});

describe('transfer', () => {
  it('should transfer when there are enough tokens', async () => {
    const consumable = await createConsumable();

    await mintConsumable(consumable, PLAYER1, 1000);

    await consumable.transfer(PLAYER2, 100, { from: PLAYER1 });

    expect<number>(await toNumberAsync(consumable.balanceOf(PLAYER1))).toEqual(900);
    expect<number>(await toNumberAsync(consumable.balanceOf(PLAYER2))).toEqual(100);
  });

  it('should not transfer if not enough consumables', async () => {
    const consumable = await createConsumable();

    await expectRevert(consumable.transfer(PLAYER2, 100, { from: PLAYER1 }), 'transfer amount exceeds balance');

    expect<number>(await toNumberAsync(consumable.balanceOf(PLAYER1))).toEqual(0);
    expect<number>(await toNumberAsync(consumable.balanceOf(PLAYER2))).toEqual(0);

    await mintConsumable(consumable, PLAYER1, 99);

    await expectRevert(consumable.transfer(PLAYER2, 100, { from: PLAYER1 }), 'transfer amount exceeds balance');

    expect<number>(await toNumberAsync(consumable.balanceOf(PLAYER1))).toEqual(99);
    expect<number>(await toNumberAsync(consumable.balanceOf(PLAYER2))).toEqual(0);
  });

  it('should not transfer if disabled', async () => {
    const consumable = await createConsumable();

    await disableContract(consumable, CONSUMABLE_MINTER);

    await mintConsumable(consumable, PLAYER1, 1000);

    await expectRevert(consumable.transfer(PLAYER2, 100, { from: PLAYER1 }), 'Contract is disabled');

    expect<number>(await toNumberAsync(consumable.balanceOf(PLAYER1))).toEqual(1000);
    expect<number>(await toNumberAsync(consumable.balanceOf(PLAYER2))).toEqual(0);
  });
});
