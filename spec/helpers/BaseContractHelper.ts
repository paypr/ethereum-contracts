import { getContract } from './ContractHelper';
import { INITIALIZER } from './Accounts';
import { ContractInfo, withDefaultContractInfo } from '../../src/contracts/core/contractInfo';

export const BaseContractContract = getContract('TestBaseContract');

export const createBaseContract = async (info: Partial<ContractInfo> = {}) => {
  const BaseContract = await BaseContractContract.new();
  await BaseContract.initialize(withDefaultContractInfo(info), { from: INITIALIZER });

  return BaseContract;
};
