import { ERC165_ID, PLAYER_ID, ROLE_DELEGATE_ID, TRANSFERRING_ID } from '../../../helpers/ContractIds';
import { createRolesWithAllSameRole } from '../../../helpers/AccessHelper';
import { HELPER1, INITIALIZER, PLAYER_ADMIN, ZERO_ADDRESS } from '../../../helpers/Accounts';
import { shouldRestrictEnableAndDisable } from '../../../helpers/DisableableHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165';
import { createPlayer, deployPlayer } from '../../../helpers/PlayerHelper';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('supportsInterface', () => {
  shouldSupportInterface('ERC165', createPlayer, ERC165_ID);
  shouldSupportInterface('Player', createPlayer, PLAYER_ID);
  shouldSupportInterface('Transfer', createPlayer, TRANSFERRING_ID);
  shouldSupportInterface('RoleDelegate', createPlayer, ROLE_DELEGATE_ID);
});

describe('initializePlayer', () => {
  it('should set roles when no delegate provided', async () => {
    const player = await deployPlayer();
    await player.connect(PLAYER_ADMIN).initializePlayer(ZERO_ADDRESS);

    expect<boolean>(await player.isSuperAdmin(INITIALIZER.address)).toBe(false);
    expect<boolean>(await player.isSuperAdmin(PLAYER_ADMIN.address)).toBe(true);
    expect<boolean>(await player.isAdmin(PLAYER_ADMIN.address)).toBe(true);
    expect<boolean>(await player.isTransferAgent(PLAYER_ADMIN.address)).toBe(true);
  });

  it('should set delegate', async () => {
    const roleDelegate = await createRolesWithAllSameRole(PLAYER_ADMIN);
    const player = await deployPlayer();
    await player.connect(PLAYER_ADMIN).initializePlayer(roleDelegate.address);

    expect<boolean>(await player.isRoleDelegate(roleDelegate.address)).toBe(true);
    expect<boolean>(await player.isSuperAdmin(PLAYER_ADMIN.address)).toBe(true);
    expect<boolean>(await player.isAdmin(PLAYER_ADMIN.address)).toBe(true);
    expect<boolean>(await player.isTransferAgent(PLAYER_ADMIN.address)).toBe(true);
  });
});

describe('Enable/Disable', () => {
  shouldRestrictEnableAndDisable(createPlayer, { getAdmin: () => PLAYER_ADMIN, getNonAdmin: () => HELPER1 });
});

describe('transferToken', () => {
  shouldTransferToken(createPlayer, { withExchange: true, getSuperAdmin: () => PLAYER_ADMIN });
});

describe('transferItem', () => {
  shouldTransferItem(createPlayer, { getSuperAdmin: () => PLAYER_ADMIN });
});
