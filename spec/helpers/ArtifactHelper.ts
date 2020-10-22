/*
 * Copyright (c) 2020 The Paypr Company, LLC
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

import { ConsumableAmount } from '../../src/contracts/core/consumables';
import { ContractInfo, withDefaultContractInfo } from '../../src/contracts/core/contractInfo';
import { getOrDefaultRoleDelegate } from './AccessHelper';
import { ARTIFACT_MINTER } from './Accounts';
import { getContract, toNumberAsync } from './ContractHelper';

export const ArtifactContract = getContract('ConfigurableArtifact');

export const createArtifact = async (
  info: Partial<ContractInfo> = {},
  baseUri: string = '',
  symbol: string = '',
  amountsToProvide: ConsumableAmount[] = [],
  initialUses: number = 1,
  roleDelegate?: string,
) => {
  const artifact = await ArtifactContract.new();
  await artifact.initializeArtifact(
    withDefaultContractInfo(info),
    baseUri,
    symbol,
    amountsToProvide,
    initialUses,
    await getOrDefaultRoleDelegate(roleDelegate, ARTIFACT_MINTER),
    {
      from: ARTIFACT_MINTER,
    },
  );
  return artifact;
};

export const mintItem = (artifact: any, to: string) => artifact.mint(to, { from: ARTIFACT_MINTER });

export const getItemUsesLeft = (artifact: any, itemId: string) => toNumberAsync(artifact.usesLeft(itemId));
