import ContractAddress from '../ContractAddress';

export interface ConsumableAmount {
  consumable: ContractAddress;
  amount: number;
}

export interface ExchangeRate {
  purchasePrice: number;
  intrinsicValue: number;
}
