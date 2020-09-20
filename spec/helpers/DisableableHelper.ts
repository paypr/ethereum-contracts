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
