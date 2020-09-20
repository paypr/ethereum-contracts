import { createRolesWithAllSameRole } from '../../../helpers/AccessHelper';
import { HELPER1, PLAYER_ADMIN, ZERO_ADDRESS } from '../../../helpers/Accounts';
import { ERC165_ID, PLAYER_ID, ROLE_DELEGATE_ID, TRANSFERRING_ID } from '../../../helpers/ContractIds';
import { shouldRestrictEnableAndDisable } from '../../../helpers/DisableableHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165';
import { createPlayer, PlayerContract } from '../../../helpers/PlayerHelper';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createPlayer, ERC165_ID);
  shouldSupportInterface('Player', createPlayer, PLAYER_ID);
  shouldSupportInterface('Transfer', createPlayer, TRANSFERRING_ID);
  shouldSupportInterface('RoleDelegate', createPlayer, ROLE_DELEGATE_ID);
});

describe('initializePlayer', () => {
  it('should set roles when no delegate provided', async () => {
    const player = await PlayerContract.new();
    await player.initializePlayer(ZERO_ADDRESS, { from: PLAYER_ADMIN });

    expect<string>(await player.isSuperAdmin(PLAYER_ADMIN)).toBe(true);
    expect<string>(await player.isAdmin(PLAYER_ADMIN)).toBe(true);
    expect<string>(await player.isTransferAgent(PLAYER_ADMIN)).toBe(true);
  });

  it('should set delegate', async () => {
    const roleDelegate = await createRolesWithAllSameRole(PLAYER_ADMIN);
    const player = await PlayerContract.new();
    await player.initializePlayer(roleDelegate.address, { from: PLAYER_ADMIN });

    expect<string>(await player.isRoleDelegate(roleDelegate.address)).toBe(true);
    expect<string>(await player.isSuperAdmin(PLAYER_ADMIN)).toBe(true);
    expect<string>(await player.isAdmin(PLAYER_ADMIN)).toBe(true);
    expect<string>(await player.isTransferAgent(PLAYER_ADMIN)).toBe(true);
  });
});

describe('Enable/Disable', () => {
  shouldRestrictEnableAndDisable(createPlayer, PLAYER_ADMIN, HELPER1);
});

describe('transferToken', () => {
  shouldTransferToken(createPlayer, { withExchange: true, superAdmin: PLAYER_ADMIN });
});

describe('transferItem', () => {
  shouldTransferItem(createPlayer, { superAdmin: PLAYER_ADMIN });
});
