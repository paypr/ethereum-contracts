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

import {
  ACTIVITY_ID,
  ARTIFACT_ID,
  BASE_CONTRACT_ID,
  Byte4String,
  CONSUMABLE_CONSUMER_ID,
  CONSUMABLE_EXCHANGE_ID,
  CONSUMABLE_ID,
  CONSUMABLE_PROVIDER_ID,
  CONVERTIBLE_CONSUMABLE_ID,
  LIMITED_CONSUMABLE_ID,
  PLAYER_ID,
  ROLE_DELEGATE_ID,
  SKILL_CONSTRAINED_ID,
  SKILL_ID,
  TRANSFERRING_ID,
} from '../../helpers/ContractIds';
import { INITIALIZER } from '../../helpers/Accounts';
import { ERC165IdCalc, ERC165IdCalc__factory } from '../../../types/contracts';

export const deployERC165IdCalcContract = () => new ERC165IdCalc__factory(INITIALIZER).deploy();

const calcShouldMatch = (
  interfaceName: string,
  calcInterfaceId: (idCalc: ERC165IdCalc) => Promise<string>,
  interfaceId: Byte4String,
) => {
  it(`calc${interfaceName}InterfaceId should match ${interfaceName} id`, async () => {
    const idCalc = await deployERC165IdCalcContract();

    expect<string>(await calcInterfaceId(idCalc)).toEqual(interfaceId);
  });
};

describe('calculations', () => {
  calcShouldMatch('Activity', (idCalc) => idCalc.calcActivityInterfaceId(), ACTIVITY_ID);
  calcShouldMatch('Artifact', (idCalc) => idCalc.calcArtifactInterfaceId(), ARTIFACT_ID);
  calcShouldMatch('Consumable', (idCalc) => idCalc.calcConsumableInterfaceId(), CONSUMABLE_ID);
  calcShouldMatch('ConsumableConsumer', (idCalc) => idCalc.calcConsumableConsumerInterfaceId(), CONSUMABLE_CONSUMER_ID);
  calcShouldMatch('ConsumableProvider', (idCalc) => idCalc.calcConsumableProviderInterfaceId(), CONSUMABLE_PROVIDER_ID);
  calcShouldMatch('ConsumableExchange', (idCalc) => idCalc.calcConsumableExchangeInterfaceId(), CONSUMABLE_EXCHANGE_ID);
  calcShouldMatch(
    'ConvertibleConsumable',
    (idCalc) => idCalc.calcConvertibleConsumableInterfaceId(),
    CONVERTIBLE_CONSUMABLE_ID,
  );
  calcShouldMatch('LimitedConsumable', (idCalc) => idCalc.calcLimitedConsumableInterfaceId(), LIMITED_CONSUMABLE_ID);
  calcShouldMatch('BaseContract', (idCalc) => idCalc.calcBaseContractInterfaceId(), BASE_CONTRACT_ID);
  calcShouldMatch('Player', (idCalc) => idCalc.calcPlayerInterfaceId(), PLAYER_ID);
  calcShouldMatch('RoleDelegate', (idCalc) => idCalc.calcRoleDelegateInterfaceId(), ROLE_DELEGATE_ID);
  calcShouldMatch('Skill', (idCalc) => idCalc.calcSkillInterfaceId(), SKILL_ID);
  calcShouldMatch('SkillConstrained', (idCalc) => idCalc.calcSkillConstrainedInterfaceId(), SKILL_CONSTRAINED_ID);
  calcShouldMatch('Transfer', (idCalc) => idCalc.calcTransferInterfaceId(), TRANSFERRING_ID);
});
