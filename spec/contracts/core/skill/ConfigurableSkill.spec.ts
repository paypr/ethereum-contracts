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
import { withDefaultContractInfo } from '../../../../src/contracts/core/contractInfo';
import { createRolesWithAllSameRole } from '../../../helpers/AccessHelper';
import { INITIALIZER } from '../../../helpers/Accounts';
import { getContractAddress } from '../../../helpers/ContractHelper';
import { shouldRestrictEnableAndDisable } from '../../../helpers/DisableableHelper';
import { createSkill, deploySkillContract } from '../../../helpers/SkillHelper';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('initializeSkill', () => {
  it('should set the name', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const skill = await deploySkillContract();
    await skill.connect(INITIALIZER).initializeSkill(withDefaultContractInfo({ name: 'the name' }), roleDelegate);

    expect<string>(await skill.contractName()).toEqual('the name');
  });

  it('should set the description', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const skill = await deploySkillContract();
    await skill
      .connect(INITIALIZER)
      .initializeSkill(withDefaultContractInfo({ description: 'the description' }), roleDelegate);

    expect<string>(await skill.contractDescription()).toEqual('the description');
  });

  it('should set the uri', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const skill = await deploySkillContract();
    await skill.connect(INITIALIZER).initializeSkill(withDefaultContractInfo({ uri: 'the uri' }), roleDelegate);

    expect<string>(await skill.contractUri()).toEqual('the uri');
  });

  it('should revert if called twice', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const skill = await deploySkillContract();
    await skill.connect(INITIALIZER).initializeSkill(withDefaultContractInfo({ name: 'the name' }), roleDelegate);

    await expect<Promise<ContractTransaction>>(
      skill.connect(INITIALIZER).initializeSkill(withDefaultContractInfo({ name: 'the new name' }), roleDelegate),
    ).toBeRevertedWith('contract is already initialized');

    expect<string>(await skill.contractName()).toEqual('the name');
  });
});

describe('Enable/Disable', () => {
  shouldRestrictEnableAndDisable(createSkill);
});

describe('transferToken', () => {
  shouldTransferToken(createSkill);
});

describe('transferItem', () => {
  shouldTransferItem(createSkill);
});
