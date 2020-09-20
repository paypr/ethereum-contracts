import { Item } from '../../src/contracts/core/activities';
import { ConsumableAmount } from '../../src/contracts/core/consumables';
import { PLAYER_ADMIN, ZERO_ADDRESS } from './Accounts';
import { getContract } from './ContractHelper';

export const PlayerContract = getContract('Player');

export const createPlayer = async (roleDelegateAddress: string = ZERO_ADDRESS) => {
  const player = await PlayerContract.new();
  player.initializePlayer(roleDelegateAddress, { from: PLAYER_ADMIN });
  return player;
};

export const executeActivity = async (
  player: any,
  activityAddress: string,
  useItems: Item[] = [],
  amountsToProvide: ConsumableAmount[] = [],
  amountsToConsume: ConsumableAmount[] = [],
) => player.execute(activityAddress, useItems, amountsToProvide, amountsToConsume, { from: PLAYER_ADMIN });
