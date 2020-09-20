import { SUPER_ADMIN } from './AccessHelper';
import { ZERO_ADDRESS } from './Accounts';
import { getContract } from './ContractHelper';

export const AccountContract = getContract('Account');

export const createAccount = async (roleDelegateAddress: string = ZERO_ADDRESS) => {
  const account = await AccountContract.new();
  await account.initializeAccount(roleDelegateAddress, { from: SUPER_ADMIN });
  return account;
};
