/*
 * Copyright (c) 2020 The Paypr Company
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
