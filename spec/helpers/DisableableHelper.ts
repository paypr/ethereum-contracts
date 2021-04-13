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

import { ContractTransaction, Signer } from 'ethers';
import { IDisableable } from '../../types/contracts';
import { INITIALIZER, PLAYER1 } from './Accounts';

export const disableContract = async (contract: IDisableable, admin: Signer = INITIALIZER) =>
  contract.connect(admin).disable();

export const enableContract = async (contract: IDisableable, admin: Signer = INITIALIZER) =>
  contract.connect(admin).enable();

interface EnableAndDisableOptions {
  getAdmin?: () => Signer;
  getNonAdmin?: () => Signer;
  expectedMessage?: string;
}

export const shouldRestrictEnableAndDisable = (
  create: () => Promise<IDisableable>,
  options: EnableAndDisableOptions = {},
) => {
  const getAdmin = options.getAdmin || (() => INITIALIZER);
  const getNonAdmin = options.getNonAdmin || (() => PLAYER1);
  const expectedMessage = options.expectedMessage || 'Caller does not have the Admin role';

  describe('enable', () => {
    it('should enable the contract if admin', async () => {
      const obj = await create();

      await enableContract(obj, getAdmin());

      expect<boolean>(await obj.enabled()).toBe(true);
    });

    it('should not enable the contract if not admin', async () => {
      const obj = await create();

      await disableContract(obj, getAdmin());

      await expect<Promise<ContractTransaction>>(enableContract(obj, getNonAdmin())).toBeRevertedWith(expectedMessage);

      expect<boolean>(await obj.enabled()).toBe(false);
    });
  });

  describe('disable', () => {
    it('should disable the contract if admin', async () => {
      const obj = await create();

      await disableContract(obj, getAdmin());

      expect<boolean>(await obj.enabled()).toBe(false);
    });

    it('should not disable the contract if not admin', async () => {
      const obj = await create();

      await expect<Promise<ContractTransaction>>(disableContract(obj, getNonAdmin())).toBeRevertedWith(expectedMessage);

      expect<boolean>(await obj.enabled()).toBe(true);
    });
  });
};
