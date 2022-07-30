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

import { BigNumber } from 'ethers';
import { DiamondConstructorParams, emptyDiamondInitFunction } from '../../../src/contracts/diamonds';
import { Diamond__factory } from '../../../types/contracts';
import { INITIALIZER } from '../../helpers/Accounts';
import { baseDiamondEstimate, EstimateTest } from '../../helpers/EstimateHelper';
import { accessControlEstimateTests } from '../facets/access/AccessControlEstimates';
import { combinedAccessEstimateTests } from '../facets/access/CombinedAccessEstimates';
import { delegatingAccessEstimateTests } from '../facets/access/DelegatingAccessEstimates';
import { activityEstimateTests } from '../facets/activity/ActivityEstimates';
import { activityExecutorEstimateTests } from '../facets/activity/activityExecutor/ActivityExecutorEstimates';
import { artifactEstimateTests } from '../facets/artifact/ArtifactEstimates';
import { consumableEstimateTests } from '../facets/consumable/ConsumableEstimates';
import { consumableMintEstimateTests } from '../facets/consumable/ConsumableMintEstimates';
import { consumableConsumerEstimateTests } from '../facets/consumable/consumer/ConsumableConsumerEstimates';
import { consumableConversionEstimateTests } from '../facets/consumable/conversion/ConsumableConversionEstimates';
import { convertibleMintEstimateTests } from '../facets/consumable/convertibleMint/ConvertibleMintEstimates';
import { consumableExchangeEstimateTests } from '../facets/consumable/exchange/ConsumableExchangeEstimates';
import { consumableExchangingEstimateTests } from '../facets/consumable/exchanging/ConsumableExchangingEstimates';
import { consumableLimiterEstimateTests } from '../facets/consumable/limit/ConsumableLimiterEstimates';
import { consumableLimitEstimateTests } from '../facets/consumable/limit/ConsumableLimitEstimates';
import { consumableProviderEstimateTests } from '../facets/consumable/provider/ConsumableProviderEstimates';
import { diamondEstimateTests } from '../facets/diamond/DiamondEstimates';
import { disableableEstimateTests } from '../facets/disableable/DisableableEstimates';
import { erc165EstimateTests } from '../facets/erc165/ERC165Estimates';
import { erc721EstimateTests } from '../facets/erc721/ERC721Estimates';
import { contractInfoEstimateTests } from '../facets/info/ContractInfoEstimates';
import { skillAcquirerEstimateTests } from '../facets/skill/skillAcquirer/SkillAcquirerEstimates';
import { skillConstrainedEstimateTests } from '../facets/skill/skillConstrained/SkillConstrainedEstimates';
import { skillEstimateTests } from '../facets/skill/SkillEstimates';
import { skillSelfAcquisitionEstimateTests } from '../facets/skill/SkillSelfAcquisitionEstimates';
import { transferEstimateTests } from '../facets/transfer/TransferEstimates';

const estimateTests: EstimateTest[] = [
  ...accessControlEstimateTests,
  ...delegatingAccessEstimateTests,
  ...combinedAccessEstimateTests,
  ...activityExecutorEstimateTests,
  ...activityEstimateTests,
  ...artifactEstimateTests,
  ...consumableEstimateTests,
  ...consumableConsumerEstimateTests,
  ...consumableConversionEstimateTests,
  ...consumableExchangeEstimateTests,
  ...consumableExchangingEstimateTests,
  ...consumableLimitEstimateTests,
  ...consumableLimiterEstimateTests,
  ...consumableMintEstimateTests,
  ...consumableProviderEstimateTests,
  ...convertibleMintEstimateTests,
  ...contractInfoEstimateTests,
  ...diamondEstimateTests,
  ...disableableEstimateTests,
  ...erc165EstimateTests,
  ...erc721EstimateTests,
  ...skillAcquirerEstimateTests,
  ...skillEstimateTests,
  ...skillConstrainedEstimateTests,
  ...skillSelfAcquisitionEstimateTests,
  ...transferEstimateTests,
];

describe('estimates', () => {
  it('base diamond without cuts', async () => {
    const deployTransaction = new Diamond__factory(INITIALIZER).getDeployTransaction({
      diamondCuts: [],
      initFunction: emptyDiamondInitFunction,
    });

    const estimate = await INITIALIZER.estimateGas(deployTransaction);
    expect<BigNumber>(estimate).toEqBN(baseDiamondEstimate);
  });

  test.each(estimateTests)(
    '%s estimate',
    async (
      name: string,
      buildConstructorParams: () => Promise<DiamondConstructorParams> | DiamondConstructorParams,
      differenceFromBase: number,
    ) => {
      const deployTransaction = new Diamond__factory(INITIALIZER).getDeployTransaction(await buildConstructorParams());

      const estimate = await INITIALIZER.estimateGas(deployTransaction);
      console.log(`Total estimate for ${name}: ${estimate.toNumber()}`);
      const estimateDiff = estimate.sub(baseDiamondEstimate);
      expect<BigNumber>(estimateDiff).toBeLteBN(1000 + differenceFromBase);
      expect<BigNumber>(estimateDiff).toBeGteBN(differenceFromBase - 1000);
    },
  );
});
