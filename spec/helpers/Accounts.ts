import { accounts } from '@openzeppelin/test-environment';
import { constants } from '@openzeppelin/test-helpers';
import ContractAddress from '../../src/contracts/ContractAddress';

export const [
  INITIALIZER,
  CONSUMABLE_MINTER,
  ARTIFACT_MINTER,
  PLAYER_ADMIN,
  PLAYER1,
  PLAYER2,
  PLAYER3,
  HELPER1,
  HELPER2,
] = accounts;

export const ZERO_ADDRESS = constants.ZERO_ADDRESS;

export const getContractAddress = async (contract: any | Promise<any>): Promise<ContractAddress> =>
  (await contract).address;
