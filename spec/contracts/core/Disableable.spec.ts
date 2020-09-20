import { expectEvent, expectRevert } from '@openzeppelin/test-helpers';
import { getContract } from '../../helpers/ContractHelper';

const DisableableContract = getContract('TestDisableable');

const createDisableable = async () => DisableableContract.new();

describe('enabled', () => {
  it('should be true on create', async () => {
    const disableable = await createDisableable();

    expect<boolean>(await disableable.enabled()).toEqual(true);
  });

  it('should be false after disabling', async () => {
    const disableable = await createDisableable();

    await disableable.disable();

    expect<boolean>(await disableable.enabled()).toEqual(false);
  });
});

describe('disabled', () => {
  it('should be false on create', async () => {
    const disableable = await createDisableable();

    expect<boolean>(await disableable.disabled()).toEqual(false);
  });

  it('should be true after disabling', async () => {
    const disableable = await createDisableable();

    await disableable.disable();

    expect<boolean>(await disableable.disabled()).toEqual(true);
  });
});

describe('disable', () => {
  it('should disable the contract', async () => {
    const disableable = await createDisableable();

    await disableable.disable();

    expect<boolean>(await disableable.enabled()).toEqual(false);
    expect<boolean>(await disableable.disabled()).toEqual(true);
  });

  it('should not error when called twice', async () => {
    const disableable = await createDisableable();

    await disableable.disable();
    await disableable.disable();

    expect<boolean>(await disableable.enabled()).toEqual(false);
    expect<boolean>(await disableable.disabled()).toEqual(true);
  });

  it('should emit Disabled event when enabled', async () => {
    const disableable = await createDisableable();

    expectEvent(await disableable.disable(), 'Disabled', {});
  });

  it.skip('should not emit Disabled event when already disabled', async () => {
    const disableable = await createDisableable();

    await disableable.disable();

    expectEvent.not(await disableable.disable(), 'Disabled', {}).not;
  });
});

describe('enable', () => {
  it('should enable the contract', async () => {
    const disableable = await createDisableable();

    await disableable.disable();
    await disableable.enable();

    expect<boolean>(await disableable.enabled()).toEqual(true);
    expect<boolean>(await disableable.disabled()).toEqual(false);
  });

  it('should not error when called twice', async () => {
    const disableable = await createDisableable();

    await disableable.enable();
    await disableable.enable();

    expect<boolean>(await disableable.enabled()).toEqual(true);
    expect<boolean>(await disableable.disabled()).toEqual(false);
  });

  it('should emit Enabled event when disabled', async () => {
    const disableable = await createDisableable();

    await disableable.disable();

    expectEvent(await disableable.enable(), 'Enabled', {});
  });

  it.skip('should not emit Enabled event when already enabled', async () => {
    const disableable = await createDisableable();

    expectEvent.not(await disableable.enable(), 'Enabled', {});
  });
});

describe('onlyEnabled', () => {
  it('should not revert when enabled', async () => {
    const disableable = await createDisableable();

    await disableable.requiresEnabled();

    await disableable.disable();
    await disableable.enable();

    await disableable.requiresEnabled();
  });

  it('should revert when disabled', async () => {
    const disableable = await createDisableable();

    await disableable.disable();

    await expectRevert(disableable.requiresEnabled(), 'Contract is disabled');

    await disableable.enable();
    await disableable.disable();

    await expectRevert(disableable.requiresEnabled(), 'Contract is disabled');
  });
});
