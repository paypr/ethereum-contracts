import { contract } from '@openzeppelin/test-environment';
import {
  ACTIVITY_ID,
  ARTIFACT_ID,
  byte4ToString,
  CONSUMABLE_CONSUMER_ID,
  CONSUMABLE_EXCHANGE_ID,
  CONSUMABLE_ID,
  CONSUMABLE_PROVIDER_ID,
  CONVERTIBLE_CONSUMABLE_ID,
  BASE_CONTRACT_ID,
  LIMITED_CONSUMABLE_ID,
  PLAYER_ID,
  SKILL_CONSTRAINED_ID,
  SKILL_ID,
  TRANSFERRING_ID,
  ROLE_DELEGATE_ID,
} from '../../helpers/ContractIds';

export const ERC165IdCalcContract = contract.fromArtifact('ERC165IdCalc');

const calcShouldMatch = (
  interfaceName: string,
  calcInterfaceId: (idCalc: any) => Promise<number[]>,
  interfaceId: number[],
) => {
  it(`calc${interfaceName}InterfaceId should match ${interfaceName} id`, async () => {
    const idCalc = await ERC165IdCalcContract.new();

    expect<number[]>(await calcInterfaceId(idCalc)).toEqual(byte4ToString(interfaceId));
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
