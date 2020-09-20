import { expectRevert } from '@openzeppelin/test-helpers';
import { ERC165_ID, BASE_CONTRACT_ID } from '../../helpers/ContractIds';
import { createBaseContract, BaseContractContract } from '../../helpers/BaseContractHelper';
import { shouldSupportInterface } from '../../helpers/ERC165';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createBaseContract, ERC165_ID);
  shouldSupportInterface('BaseContract', createBaseContract, BASE_CONTRACT_ID);
});

describe('initialize', () => {
  it('should set the name', async () => {
    const BaseContract = await BaseContractContract.new();
    await BaseContract.initialize({ name: 'the name', description: '', uri: '' });

    expect<string>(await BaseContract.contractName()).toEqual('the name');
  });

  it('should set the description', async () => {
    const BaseContract = await BaseContractContract.new();
    await BaseContract.initialize({ name: '', description: 'the description', uri: '' });

    expect<string>(await BaseContract.contractDescription()).toEqual('the description');
  });

  it('should set the uri', async () => {
    const BaseContract = await BaseContractContract.new();
    await BaseContract.initialize({ name: '', description: '', uri: 'the uri' });

    expect<string>(await BaseContract.contractUri()).toEqual('the uri');
  });

  it('should revert if called twice', async () => {
    const BaseContract = await BaseContractContract.new();
    await BaseContract.initialize({ name: 'the name', description: '', uri: '' });

    await expectRevert(
      BaseContract.initialize({ name: 'the new name', description: '', uri: '' }),
      'Contract instance has already been initialized',
    );

    expect<string>(await BaseContract.contractName()).toEqual('the name');
  });
});
