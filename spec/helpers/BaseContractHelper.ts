/*
 * Copyright (c) 2020 The Paypr Company
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

import { getContract } from './ContractHelper';
import { INITIALIZER } from './Accounts';
import { ContractInfo, withDefaultContractInfo } from '../../src/contracts/core/contractInfo';

export const BaseContractContract = getContract('TestBaseContract');

export const createBaseContract = async (info: Partial<ContractInfo> = {}) => {
  const BaseContract = await BaseContractContract.new();
  await BaseContract.initialize(withDefaultContractInfo(info), { from: INITIALIZER });

  return BaseContract;
};
