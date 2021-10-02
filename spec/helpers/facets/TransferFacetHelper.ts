import { Contract, Signer } from 'ethers';
import { buildDiamondFacetCut } from '../../../src/contracts/diamonds';
import { TRANSFER_AGENT_ROLE } from '../../../src/contracts/roles';
import { ITransferring__factory, TransferFacet__factory } from '../../../types/contracts';
import { INITIALIZER, TRANSFER_AGENT } from '../Accounts';
import { ExtensibleDiamondOptions } from '../DiamondHelper';

export const asTransferring = (contract: Contract, signer: Signer = TRANSFER_AGENT) =>
  ITransferring__factory.connect(contract.address, signer);

export const buildTransferringDiamondAdditions = async (): Promise<ExtensibleDiamondOptions> => ({
  additionalCuts: [buildDiamondFacetCut(await deployTransferFacet())],
  additionalRoleMembers: [{ role: TRANSFER_AGENT_ROLE, members: [TRANSFER_AGENT.address] }],
});

export const deployTransferFacet = () => new TransferFacet__factory(INITIALIZER).deploy();
