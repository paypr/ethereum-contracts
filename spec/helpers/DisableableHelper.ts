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

import { expectRevert } from '@openzeppelin/test-helpers';
import { INITIALIZER, PLAYER1 } from './Accounts';

export const disableContract = async (contract: any, admin: string = INITIALIZER) => contract.disable({ from: admin });

export const enableContract = async (contract: any, admin: string = INITIALIZER) => contract.enable({ from: admin });

export const shouldRestrictEnableAndDisable = (
  create: () => Promise<any>,
  admin: string = INITIALIZER,
  nonAdmin: string = PLAYER1,
  expectedMessage: string = 'Caller does not have the Admin role',
) => {
  describe('enable', () => {
    it('should enable the contract if admin', async () => {
      const obj = await create();

      await enableContract(obj, admin);

      expect<boolean>(await obj.enabled()).toBe(true);
    });

    it('should not enable the contract if not admin', async () => {
      const obj = await create();

      await disableContract(obj, admin);

      await expectRevert(enableContract(obj, nonAdmin), expectedMessage);

      expect<boolean>(await obj.enabled()).toBe(false);
    });
  });

  describe('disable', () => {
    it('should disable the contract if admin', async () => {
      const obj = await create();

      await disableContract(obj, admin);

      expect<boolean>(await obj.enabled()).toBe(false);
    });

    it('should not disable the contract if not admin', async () => {
      const obj = await create();

      await expectRevert(disableContract(obj, nonAdmin), expectedMessage);

      expect<boolean>(await obj.enabled()).toBe(true);
    });
  });
};
