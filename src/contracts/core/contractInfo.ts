export interface ContractInfo {
  name: string;
  description: string;
  uri: string;
}

export type ContractInfoOptions = Partial<ContractInfo>;

const defaultContractInfo: ContractInfo = {
  name: '',
  description: '',
  uri: '',
};

export const withDefaultContractInfo = (info?: ContractInfoOptions): ContractInfo => ({
  ...defaultContractInfo,
  ...info,
});
