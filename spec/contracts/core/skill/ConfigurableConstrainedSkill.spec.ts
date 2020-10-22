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

import { expectRevert } from '@openzeppelin/test-helpers';
import { withDefaultContractInfo } from '../../../../src/contracts/core/contractInfo';
import { createRolesWithAllSameRole } from '../../../helpers/AccessHelper';
import { getContractAddress, INITIALIZER } from '../../../helpers/Accounts';
import { createConsumable } from '../../../helpers/ConsumableHelper';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import { shouldRestrictEnableAndDisable } from '../../../helpers/DisableableHelper';
import { ConstrainedSkillContract, createConstrainedSkill, createSkill } from '../../../helpers/SkillHelper';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('initializeConstrainedSkill', () => {
  it('should set the name', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const skill = await ConstrainedSkillContract.new();
    await skill.initializeConstrainedSkill(withDefaultContractInfo({ name: 'the name' }), [], [], roleDelegate, {
      from: INITIALIZER,
    });

    expect<string>(await skill.contractName()).toEqual('the name');
  });

  it('should set the description', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const skill = await ConstrainedSkillContract.new();
    await skill.initializeConstrainedSkill(
      withDefaultContractInfo({ description: 'the description' }),
      [],
      [],
      roleDelegate,
      {
        from: INITIALIZER,
      },
    );

    expect<string>(await skill.contractDescription()).toEqual('the description');
  });

  it('should set the uri', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const skill = await ConstrainedSkillContract.new();
    await skill.initializeConstrainedSkill(withDefaultContractInfo({ uri: 'the uri' }), [], [], roleDelegate, {
      from: INITIALIZER,
    });

    expect<string>(await skill.contractUri()).toEqual('the uri');
  });

  it('should set amounts to consume', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });

    const skill = await ConstrainedSkillContract.new();
    await skill.initializeConstrainedSkill(
      withDefaultContractInfo({ name: 'Skill' }),
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
      [],
      roleDelegate,
      { from: INITIALIZER },
    );

    expect(await skill.consumablesRequired()).toEqual([consumable1.address, consumable2.address]);

    expect<boolean>(await skill.isRequired(consumable1.address)).toBe(true);
    expect<boolean>(await skill.isRequired(consumable2.address)).toBe(true);

    expect<number>(await toNumberAsync(skill.amountRequired(consumable1.address))).toEqual(100);
    expect<number>(await toNumberAsync(skill.amountRequired(consumable2.address))).toEqual(200);
  });

  it('should add skill requirements', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const skill1 = await createSkill({ name: 'Basic 1' });
    const skill2 = await createSkill({ name: 'Basic 2' });

    const skill = await ConstrainedSkillContract.new();
    await skill.initializeConstrainedSkill(
      withDefaultContractInfo({ name: 'Constrained' }),
      [],
      [
        { skill: skill1.address, level: 1 },
        { skill: skill2.address, level: 2 },
      ],
      roleDelegate,
      { from: INITIALIZER },
    );

    expect(await skill.skillsRequired()).toEqual([skill1.address, skill2.address]);

    expect<boolean>(await skill.isSkillRequired(skill1.address)).toBe(true);
    expect<boolean>(await skill.isSkillRequired(skill2.address)).toBe(true);

    expect<number>(await toNumberAsync(skill.skillLevelRequired(skill1.address))).toEqual(1);
    expect<number>(await toNumberAsync(skill.skillLevelRequired(skill2.address))).toEqual(2);
  });

  it('should revert if called twice', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const skill = await ConstrainedSkillContract.new();
    await skill.initializeConstrainedSkill(withDefaultContractInfo({ name: 'the name' }), [], [], roleDelegate, {
      from: INITIALIZER,
    });

    await expectRevert(
      skill.initializeConstrainedSkill(withDefaultContractInfo({ name: 'the new name' }), [], [], roleDelegate, {
        from: INITIALIZER,
      }),
      'Contract instance has already been initialized',
    );

    expect<string>(await skill.contractName()).toEqual('the name');
  });
});

describe('Enable/Disable', () => {
  shouldRestrictEnableAndDisable(createConstrainedSkill);
});

describe('transferToken', () => {
  shouldTransferToken(createConstrainedSkill);
});

describe('transferItem', () => {
  shouldTransferItem(createConstrainedSkill);
});
