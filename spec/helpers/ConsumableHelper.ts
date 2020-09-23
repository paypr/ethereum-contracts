import { ConsumableAmount, ExchangeRate } from '../../src/contracts/core/consumables';
import { ContractInfo, withDefaultContractInfo } from '../../src/contracts/core/contractInfo';
import { getOrDefaultRoleDelegate } from './AccessHelper';
import { CONSUMABLE_MINTER } from './Accounts';
import { getContract, toNumber, toNumberAsync } from './ContractHelper';

export const ConsumableContract = getContract('ConfigurableConsumable');
export const ConsumableConsumerContract = getContract('TestConsumableConsumer');
export const ConsumableProviderContract = getContract('TestConsumableProvider');
export const ConsumableExchangeContract = getContract('TestConsumableExchange');
export const ConvertibleConsumableContract = getContract('ConfigurableConvertibleConsumable');
export const LimitedConsumableContract = getContract('ConfigurableLimitedConsumable');
export const PayprContract = getContract('Paypr');

export const createConsumable = async (
  info: Partial<ContractInfo> = {},
  symbol: string = info.name || '',
  roleDelegate?: string,
) => {
  const consumable = await ConsumableContract.new();
  await consumable.initializeConsumable(
    withDefaultContractInfo(info),
    symbol,
    await getOrDefaultRoleDelegate(roleDelegate, CONSUMABLE_MINTER),
    { from: CONSUMABLE_MINTER },
  );
  return consumable;
};

export const createConsumableConsumer = async (amountsToConsume: ConsumableAmount[] = []) => {
  const consumer = await ConsumableConsumerContract.new();
  await consumer.initializeConsumableConsumer(amountsToConsume, { from: CONSUMABLE_MINTER });
  return consumer;
};

export const createConsumableProvider = async (amountsToProvide: ConsumableAmount[] = []) => {
  const provider = await ConsumableProviderContract.new();
  await provider.initializeConsumableProvider(amountsToProvide, { from: CONSUMABLE_MINTER });
  return provider;
};

export const createConsumableExchange = async (info: Partial<ContractInfo> = {}, symbol: string = '') => {
  const exchange = await ConsumableExchangeContract.new();
  await exchange.initializeConsumableExchange(withDefaultContractInfo(info), symbol, {
    from: CONSUMABLE_MINTER,
  });
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
  const consumable = await ConvertibleConsumableContract.new();
  await consumable.initializeConvertibleConsumable(
    withDefaultContractInfo(info),
    symbol,
    exchangeToken,
    purchasePriceExchangeRate,
    intrinsicValueExchangeRate,
    registerWithExchange,
    await getOrDefaultRoleDelegate(roleDelegate, CONSUMABLE_MINTER),
    { from: CONSUMABLE_MINTER },
  );
  return consumable;
};

export const createLimitedConsumable = async (
  info: Partial<ContractInfo> = {},
  symbol: string = '',
  roleDelegate?: string,
) => {
  const consumable = await LimitedConsumableContract.new();
  await consumable.initializeLimitedConsumable(
    withDefaultContractInfo(info),
    symbol,
    await getOrDefaultRoleDelegate(roleDelegate, CONSUMABLE_MINTER),
    { from: CONSUMABLE_MINTER },
  );
  return consumable;
};

export const createPaypr = async (
  baseToken: string,
  basePurchasePriceExchangeRate: number = 1,
  baseIntrinsicValueExchangeRate: number = basePurchasePriceExchangeRate,
  roleDelegate?: string,
) => {
  const consumable = await PayprContract.new();
  await consumable.initializePaypr(
    baseToken,
    basePurchasePriceExchangeRate,
    baseIntrinsicValueExchangeRate,
    await getOrDefaultRoleDelegate(roleDelegate, CONSUMABLE_MINTER),
    {
      from: CONSUMABLE_MINTER,
    },
  );
  return consumable;
};

export const getBalance = async (consumable: any, account: string) => toNumberAsync(consumable.balanceOf(account));

export const getAllowance = async (consumable: any, sender: string, receiver: string) =>
  toNumberAsync(consumable.allowance(sender, receiver));

export const increaseAllowance = async (consumable: any, sender: string, receiver: string, amount: number) =>
  consumable.increaseAllowance(receiver, amount, { from: sender });

export const transferFrom = async (consumable: any, sender: string, receiver: string, amount: number) =>
  consumable.transferFrom(sender, receiver, amount, { from: receiver });

export const mintConsumable = async (consumable: any, receiver: string, amount: number) =>
  consumable.mint(receiver, amount, { from: CONSUMABLE_MINTER });

export const burnConsumable = async (consumable: any, receiver: string, amount: number) =>
  consumable.burn(receiver, amount, { from: CONSUMABLE_MINTER });

export const getLimit = async (consumable: any, account: string) => toNumberAsync(consumable.limitOf(account));

export const increaseLimit = async (consumable: any, account: string, amount: number) =>
  consumable.increaseLimit(account, amount, { from: CONSUMABLE_MINTER });

export const decreaseLimit = async (consumable: any, account: string, amount: number) =>
  consumable.decreaseLimit(account, amount, { from: CONSUMABLE_MINTER });

export const toExchangeRateAsync = async (exchangeRatePromise: Promise<ExchangeRate> | ExchangeRate) => {
  const { purchasePrice, intrinsicValue } = await exchangeRatePromise;
  return { purchasePrice: toNumber(purchasePrice), intrinsicValue: toNumber(intrinsicValue) };
};
