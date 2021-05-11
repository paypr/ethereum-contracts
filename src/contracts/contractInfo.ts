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

import { ContractInfoInit } from '../../types/contracts';
import { DiamondInitFunction } from './core/diamonds';

export interface ContractInfoInitData {
  name: string;
  symbol: string;
  description: string;
  uri: string;
}

export type ContractInfoInitOptions = Partial<ContractInfoInitData>;

const defaultContractInfoInitData: ContractInfoInitData = {
  name: '',
  symbol: '',
  description: '',
  uri: '',
};

export const withDefaultContractInfo = (info?: ContractInfoInitOptions): ContractInfoInitData => ({
  ...defaultContractInfoInitData,
  ...info,
});

export const buildContractInfoInitializeInitFunction = (
  contractInfoInit: ContractInfoInit,
  infoData: ContractInfoInitOptions,
): DiamondInitFunction => ({
  initAddress: contractInfoInit.address,
  callData: encodeContractInfoInitializeCallData(contractInfoInit, infoData),
});

export const encodeContractInfoInitializeCallData = (
  contractInfoInit: ContractInfoInit,
  infoData: ContractInfoInitOptions,
) => contractInfoInit.interface.encodeFunctionData('initialize', [withDefaultContractInfo(infoData)]);

export const buildContractInfoSetNameInitFunction = (
  contractInfoInit: ContractInfoInit,
  name: string,
): DiamondInitFunction => ({
  initAddress: contractInfoInit.address,
  callData: encodeContractInfoSetNameCallData(contractInfoInit, name),
});

export const encodeContractInfoSetNameCallData = (contractInfoInit: ContractInfoInit, name: string) =>
  contractInfoInit.interface.encodeFunctionData('setName', [name]);

export const buildContractInfoSetSymbolInitFunction = (
  contractInfoInit: ContractInfoInit,
  symbol: string,
): DiamondInitFunction => ({
  initAddress: contractInfoInit.address,
  callData: encodeContractInfoSetSymbolCallData(contractInfoInit, symbol),
});

export const encodeContractInfoSetSymbolCallData = (contractInfoInit: ContractInfoInit, symbol: string) =>
  contractInfoInit.interface.encodeFunctionData('setSymbol', [symbol]);

export const buildContractInfoSetDescriptionInitFunction = (
  contractInfoInit: ContractInfoInit,
  description: string,
): DiamondInitFunction => ({
  initAddress: contractInfoInit.address,
  callData: encodeContractInfoSetDescriptionCallData(contractInfoInit, description),
});

export const encodeContractInfoSetDescriptionCallData = (contractInfoInit: ContractInfoInit, description: string) =>
  contractInfoInit.interface.encodeFunctionData('setDescription', [description]);

export const buildContractInfoSetUriInitFunction = (
  contractInfoInit: ContractInfoInit,
  uri: string,
): DiamondInitFunction => ({
  initAddress: contractInfoInit.address,
  callData: encodeContractInfoSetUriCallData(contractInfoInit, uri),
});

export const encodeContractInfoSetUriCallData = (contractInfoInit: ContractInfoInit, uri: string) =>
  contractInfoInit.interface.encodeFunctionData('setUri', [uri]);
