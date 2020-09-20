import { expectRevert } from '@openzeppelin/test-helpers';
import { withDefaultContractInfo } from '../../../../src/contracts/core/contractInfo';
import { createRolesWithAllSameRole } from '../../../helpers/AccessHelper';
import { getContractAddress, INITIALIZER } from '../../../helpers/Accounts';
import { shouldRestrictEnableAndDisable } from '../../../helpers/DisableableHelper';
import { createSkill, SkillContract } from '../../../helpers/SkillHelper';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('initializeSkill', () => {
  it('should set the name', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const skill = await SkillContract.new();
    await skill.initializeSkill(withDefaultContractInfo({ name: 'the name' }), roleDelegate, { from: INITIALIZER });

    expect<string>(await skill.contractName()).toEqual('the name');
  });

  it('should set the description', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const skill = await SkillContract.new();
    await skill.initializeSkill(withDefaultContractInfo({ description: 'the description' }), roleDelegate, {
      from: INITIALIZER,
    });

    expect<string>(await skill.contractDescription()).toEqual('the description');
  });

  it('should set the uri', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const skill = await SkillContract.new();
    await skill.initializeSkill(withDefaultContractInfo({ uri: 'the uri' }), roleDelegate, { from: INITIALIZER });

    expect<string>(await skill.contractUri()).toEqual('the uri');
  });

  it('should revert if called twice', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(INITIALIZER));

    const skill = await SkillContract.new();
    await skill.initializeSkill(withDefaultContractInfo({ name: 'the name' }), roleDelegate, { from: INITIALIZER });

    await expectRevert(
      skill.initializeSkill(withDefaultContractInfo({ name: 'the new name' }), roleDelegate, { from: INITIALIZER }),
      'Contract instance has already been initialized',
    );

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
