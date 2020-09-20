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
