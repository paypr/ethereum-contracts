import { contract } from '@openzeppelin/test-environment';

export const getContract = (contractName: string) => contract.fromArtifact(contractName);

export const toNumber = (bigNumber: any) => Number(bigNumber.toString());

export const toNumberAsync = async (bigNumberPromise: Promise<any> | any) => toNumber(await bigNumberPromise);
