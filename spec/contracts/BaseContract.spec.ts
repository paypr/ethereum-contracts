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

import { ContractTransaction } from 'ethers';
import { createBaseContract, deployBaseContract } from '../helpers/BaseContractHelper';
import { BASE_CONTRACT_ID, ERC165_ID } from '../helpers/ContractIds';
import { shouldSupportInterface } from '../helpers/ERC165';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createBaseContract, ERC165_ID);
  shouldSupportInterface('BaseContract', createBaseContract, BASE_CONTRACT_ID);
});

describe('initialize', () => {
  it('should set the name', async () => {
    const BaseContract = await deployBaseContract();
    await BaseContract.initialize({ name: 'the name', description: '', uri: '' });

    expect<string>(await BaseContract.contractName()).toEqual('the name');
  });

  it('should set the description', async () => {
    const BaseContract = await deployBaseContract();
    await BaseContract.initialize({ name: '', description: 'the description', uri: '' });

    expect<string>(await BaseContract.contractDescription()).toEqual('the description');
  });

  it('should set the uri', async () => {
    const BaseContract = await deployBaseContract();
    await BaseContract.initialize({ name: '', description: '', uri: 'the uri' });

    expect<string>(await BaseContract.contractUri()).toEqual('the uri');
  });

  it('should revert if called twice', async () => {
    const BaseContract = await deployBaseContract();
    await BaseContract.initialize({ name: 'the name', description: '', uri: '' });

    await expect<Promise<ContractTransaction>>(
      BaseContract.initialize({
        name: 'the new name',
        description: '',
        uri: '',
      }),
    ).toBeRevertedWith('contract is already initialized');

    expect<string>(await BaseContract.contractName()).toEqual('the name');
  });
});
