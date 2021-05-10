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

import { Provider } from '@ethersproject/providers';
import { BigNumber, BigNumberish, ContractTransaction, Overrides, Signer } from 'ethers';
import { ConsumableAmount, ExchangeRate } from '../../src/contracts/core/consumables';
import { ContractInfo, withDefaultContractInfo } from '../../src/contracts/core/contractInfo';
import {
  ConfigurableConsumable__factory,
  ConfigurableConvertibleConsumable__factory,
  ConfigurableLimitedConsumable,
  ConfigurableLimitedConsumable__factory,
  Paypr__factory,
  TestConsumableConsumer__factory,
  TestConsumableExchange__factory,
  TestConsumableProvider__factory,
} from '../../types/contracts';
import { getOrDefaultRoleDelegate } from './AccessHelper';
import { CONSUMABLE_MINTER, INITIALIZER } from './Accounts';

export const deployConsumableContract = () => new ConfigurableConsumable__factory(INITIALIZER).deploy();
export const deployConsumableConsumerContract = () => new TestConsumableConsumer__factory(INITIALIZER).deploy();
export const deployConsumableProviderContract = () => new TestConsumableProvider__factory(INITIALIZER).deploy();
export const deployConsumableExchangeContract = () => new TestConsumableExchange__factory(INITIALIZER).deploy();
export const deployConvertibleConsumableContract = () =>
  new ConfigurableConvertibleConsumable__factory(INITIALIZER).deploy();
export const deployLimitedConsumableContract = () => new ConfigurableLimitedConsumable__factory(INITIALIZER).deploy();
export const deployPayprContract = () => new Paypr__factory(INITIALIZER).deploy();

export const createConsumable = async (
  info: Partial<ContractInfo> = {},
  symbol: string = info.name || '',
  roleDelegate?: string,
) => {
  const consumable = await deployConsumableContract();
  await consumable
    .connect(CONSUMABLE_MINTER)
    .initializeConsumable(
      withDefaultContractInfo(info),
      symbol,
      await getOrDefaultRoleDelegate(roleDelegate, CONSUMABLE_MINTER),
    );
  return consumable;
};

export const createConsumableConsumer = async (amountsToConsume: ConsumableAmount[] = []) => {
  const consumer = await deployConsumableConsumerContract();
  await consumer.connect(CONSUMABLE_MINTER).initializeConsumableConsumer(amountsToConsume);
  return consumer;
};

export const createConsumableProvider = async (amountsToProvide: ConsumableAmount[] = []) => {
  const provider = await deployConsumableProviderContract();
  await provider.connect(CONSUMABLE_MINTER).initializeConsumableProvider(amountsToProvide);
  return provider;
};

export const createConsumableExchange = async (info: Partial<ContractInfo> = {}, symbol: string = '') => {
  const exchange = await deployConsumableExchangeContract();
  await exchange.connect(CONSUMABLE_MINTER).initializeConsumableExchange(withDefaultContractInfo(info), symbol);
  return exchange;
};

export const createConvertibleConsumable = async (
  exchangeToken: string,
  info: Partial<ContractInfo> = {},
  symbol: string = '',
  purchasePriceExchangeRate: number = 1,
  intrinsicValueExchangeRate: number = purchasePriceExchangeRate,
  registerWithExchange: boolean = true,
  roleDelegate?: string,
) => {
  const consumable = await deployConvertibleConsumableContract();
  await consumable
    .connect(CONSUMABLE_MINTER)
    .initializeConvertibleConsumable(
      withDefaultContractInfo(info),
      symbol,
      exchangeToken,
      purchasePriceExchangeRate,
      intrinsicValueExchangeRate,
      registerWithExchange,
      await getOrDefaultRoleDelegate(roleDelegate, CONSUMABLE_MINTER),
    );
  return consumable;
};

export const createLimitedConsumable = async (
  info: Partial<ContractInfo> = {},
  symbol: string = '',
  roleDelegate?: string,
) => {
  const consumable = await deployLimitedConsumableContract();
  await consumable
    .connect(CONSUMABLE_MINTER)
    .initializeLimitedConsumable(
      withDefaultContractInfo(info),
      symbol,
      await getOrDefaultRoleDelegate(roleDelegate, CONSUMABLE_MINTER),
    );
  return consumable;
};

export const createPaypr = async (
  baseToken: string,
  basePurchasePriceExchangeRate: number = 1,
  baseIntrinsicValueExchangeRate: number = basePurchasePriceExchangeRate,
  roleDelegate?: string,
) => {
  const consumable = await deployPayprContract();
  await consumable
    .connect(CONSUMABLE_MINTER)
    .initializePaypr(
      baseToken,
      basePurchasePriceExchangeRate,
      baseIntrinsicValueExchangeRate,
      await getOrDefaultRoleDelegate(roleDelegate, CONSUMABLE_MINTER),
    );
  return consumable;
};

type MintableAndBurnableConsumable = {
  connect(signerOrProvider: Signer | Provider | string): MintableAndBurnableConsumable;

  mint(
    account: string,
    amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  burn(
    account: string,
    amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;
};

export const mintConsumable = async (consumable: MintableAndBurnableConsumable, receiver: string, amount: number) =>
  consumable.connect(CONSUMABLE_MINTER).mint(receiver, amount);

export const burnConsumable = async (consumable: MintableAndBurnableConsumable, receiver: string, amount: number) =>
  consumable.connect(CONSUMABLE_MINTER).burn(receiver, amount);

export const increaseLimit = async (consumable: ConfigurableLimitedConsumable, account: string, amount: number) =>
  consumable.connect(CONSUMABLE_MINTER).increaseLimit(account, amount);

export const decreaseLimit = async (consumable: ConfigurableLimitedConsumable, account: string, amount: number) =>
  consumable.connect(CONSUMABLE_MINTER).decreaseLimit(account, amount);

export const toExchangeRateAsync = async (
  exchangeRatePromise:
    | Promise<{
        purchasePrice: BigNumber;
        intrinsicValue: BigNumber;
      }>
    | {
        purchasePrice: BigNumber;
        intrinsicValue: BigNumber;
      },
): Promise<ExchangeRate> => {
  const { purchasePrice, intrinsicValue } = await exchangeRatePromise;
  return { purchasePrice: purchasePrice.toNumber(), intrinsicValue: intrinsicValue.toNumber() };
};
