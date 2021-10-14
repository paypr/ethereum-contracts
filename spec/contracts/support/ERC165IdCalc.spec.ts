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

import { Erc165InterfaceId } from '../../../src/contracts/erc165';
import {
  ACCESS_CONTROL_INTERFACE_ID,
  ACCESS_CHECK_INTERFACE_ID,
  ACTIVITY_EXECUTOR_INTERFACE_ID,
  ACTIVITY_INTERFACE_ID,
  ARTIFACT_INTERFACE_ID,
  ARTIFACT_MINTABLE_INTERFACE_ID,
  CONSUMABLE_CONSUMER_INTERFACE_ID,
  CONSUMABLE_CONVERSION_INTERFACE_ID,
  CONSUMABLE_EXCHANGE_INTERFACE_ID,
  CONSUMABLE_EXCHANGING_INTERFACE_ID,
  CONSUMABLE_INTERFACE_ID,
  CONSUMABLE_LIMIT_INTERFACE_ID,
  CONSUMABLE_LIMITER_INTERFACE_ID,
  CONSUMABLE_MINT_INTERFACE_ID,
  CONSUMABLE_PROVIDER_INTERFACE_ID,
  CONTRACT_INFO_INTERFACE_ID,
  DELEGATING_ACCESS_INTERFACE_ID,
  DIAMOND_CUT_INTERFACE_ID,
  DIAMOND_LOUPE_INTERFACE_ID,
  DISABLEABLE_INTERFACE_ID,
  ERC165_INTERFACE_ID,
  ERC721_BURNABLE_INTERFACE_ID,
  ERC721_INTERFACE_ID,
  ERC721_METADATA_INTERFACE_ID,
  ERC721_MINTABLE_INTERFACE_ID,
  ERC721_TOKEN_INFO_INTERFACE_ID,
  SKILL_ACQUIRER_INTERFACE_ID,
  SKILL_CONSTRAINED_INTERFACE_ID,
  SKILL_INTERFACE_ID,
  SKILL_SELF_ACQUISITION_INTERFACE_ID,
  TRANSFERRING_INTERFACE_ID,
  ERC721_ENUMERABLE_INTERFACE_ID,
} from '../../../src/contracts/erc165InterfaceIds';
import { ERC165IdCalc, ERC165IdCalc__factory } from '../../../types/contracts';
import { INITIALIZER } from '../../helpers/Accounts';

export const deployERC165IdCalcContract = () => new ERC165IdCalc__factory(INITIALIZER).deploy();

type InterfaceTest = [string, Erc165InterfaceId, (ERC165IdCalc) => Promise<Erc165InterfaceId>];

const interfaceTests: InterfaceTest[] = [
  ['AccessCheck', ACCESS_CHECK_INTERFACE_ID, (idCalc) => idCalc.calcAccessCheckInterfaceId()],
  ['AccessControl', ACCESS_CONTROL_INTERFACE_ID, (idCalc) => idCalc.calcAccessControlInterfaceId()],
  ['Activity', ACTIVITY_INTERFACE_ID, (idCalc) => idCalc.calcActivityInterfaceId()],
  ['ActivityExecutor', ACTIVITY_EXECUTOR_INTERFACE_ID, (idCalc) => idCalc.calcActivityExecutorInterfaceId()],
  ['Artifact', ARTIFACT_INTERFACE_ID, (idCalc) => idCalc.calcArtifactInterfaceId()],
  ['ArtifactMintable', ARTIFACT_MINTABLE_INTERFACE_ID, (idCalc) => idCalc.calcArtifactMintableInterfaceId()],
  ['Consumable', CONSUMABLE_INTERFACE_ID, (idCalc) => idCalc.calcConsumableInterfaceId()],
  ['ConsumableConsumer', CONSUMABLE_CONSUMER_INTERFACE_ID, (idCalc) => idCalc.calcConsumableConsumerInterfaceId()],
  [
    'ConsumableConversion',
    CONSUMABLE_CONVERSION_INTERFACE_ID,
    (idCalc) => idCalc.calcConsumableConversionInterfaceId(),
  ],
  ['ConsumableExchange', CONSUMABLE_EXCHANGE_INTERFACE_ID, (idCalc) => idCalc.calcConsumableExchangeInterfaceId()],
  [
    'ConsumableExchanging',
    CONSUMABLE_EXCHANGING_INTERFACE_ID,
    (idCalc) => idCalc.calcConsumableExchangingInterfaceId(),
  ],
  ['ConsumableLimit', CONSUMABLE_LIMIT_INTERFACE_ID, (idCalc) => idCalc.calcConsumableLimitInterfaceId()],
  ['ConsumableLimiter', CONSUMABLE_LIMITER_INTERFACE_ID, (idCalc) => idCalc.calcConsumableLimiterInterfaceId()],
  ['ConsumableMint', CONSUMABLE_MINT_INTERFACE_ID, (idCalc) => idCalc.calcConsumableMintInterfaceId()],
  ['ConsumableProvider', CONSUMABLE_PROVIDER_INTERFACE_ID, (idCalc) => idCalc.calcConsumableProviderInterfaceId()],
  ['ContractInfo', CONTRACT_INFO_INTERFACE_ID, (idCalc) => idCalc.calcContractInfoInterfaceId()],
  ['DelegatingAccess', DELEGATING_ACCESS_INTERFACE_ID, (idCalc) => idCalc.calcDelegatingAccessInterfaceId()],
  ['DiamondCut', DIAMOND_CUT_INTERFACE_ID, (idCalc) => idCalc.calcDiamondCutInterfaceId()],
  ['DiamondLoupe', DIAMOND_LOUPE_INTERFACE_ID, (idCalc) => idCalc.calcDiamondLoupeInterfaceId()],
  ['Disableable', DISABLEABLE_INTERFACE_ID, (idCalc) => idCalc.calcDisableableInterfaceId()],
  ['ERC165', ERC165_INTERFACE_ID, (idCalc) => idCalc.calcERC165InterfaceId()],
  ['ERC721', ERC721_INTERFACE_ID, (idCalc) => idCalc.calcERC721InterfaceId()],
  ['ERC721Burnable', ERC721_BURNABLE_INTERFACE_ID, (idCalc) => idCalc.calcERC721BurnableInterfaceId()],
  ['ERC721Enumerable', ERC721_ENUMERABLE_INTERFACE_ID, (idCalc) => idCalc.calcERC721EnumerableInterfaceId()],
  ['ERC721Metadata', ERC721_METADATA_INTERFACE_ID, (idCalc) => idCalc.calcERC721MetadataInterfaceId()],
  ['ERC721Mintable', ERC721_MINTABLE_INTERFACE_ID, (idCalc) => idCalc.calcERC721MintableInterfaceId()],
  ['ERC721TokenInfo', ERC721_TOKEN_INFO_INTERFACE_ID, (idCalc) => idCalc.calcERC721TokenInfoInterfaceId()],
  ['Skill', SKILL_INTERFACE_ID, (idCalc) => idCalc.calcSkillInterfaceId()],
  ['SkillAcquirer', SKILL_ACQUIRER_INTERFACE_ID, (idCalc) => idCalc.calcSkillAcquirerInterfaceId()],
  ['SkillConstrained', SKILL_CONSTRAINED_INTERFACE_ID, (idCalc) => idCalc.calcSkillConstrainedInterfaceId()],
  [
    'SkillSelfAcquisition',
    SKILL_SELF_ACQUISITION_INTERFACE_ID,
    (idCalc) => idCalc.calcSkillSelfAcquisitionInterfaceId(),
  ],
  ['Transfer', TRANSFERRING_INTERFACE_ID, (idCalc) => idCalc.calcTransferInterfaceId()],
];

describe('calculations', () => {
  test.each(interfaceTests)(
    'should match %s interface id',
    async (
      interfaceName: string,
      interfaceId: Erc165InterfaceId,
      calcInterfaceId: (idCalc: ERC165IdCalc) => Promise<Erc165InterfaceId>,
    ) => {
      const idCalc = await deployERC165IdCalcContract();

      expect<string>(await calcInterfaceId(idCalc)).toEqual(interfaceId);
    },
  );

  it('should not have any duplicates', () => {
    const interfaceIds = interfaceTests.map((it) => it[1]);
    const interfaceSet = new Set(interfaceIds);

    expect<number>(interfaceIds.length).toEqual(interfaceSet.size);
  });
});
