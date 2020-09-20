import { expectRevert } from '@openzeppelin/test-helpers';
import { INITIALIZER, PLAYER3 } from './Accounts';
import { createArtifact, mintItem } from './ArtifactHelper';
import {
  createConsumable,
  createConsumableExchange,
  createConvertibleConsumable,
  getBalance,
  mintConsumable,
} from './ConsumableHelper';
import { getContract } from './ContractHelper';
import { disableContract } from './DisableableHelper';

export const TransferringContract = getContract('TestTransfer');
export const ExchangingTransferringContract = getContract('TestExchangingTransfer');

export const createTransferring = async () => {
  const transferring = await TransferringContract.new();
  await transferring.initializeTestTransfer({ from: INITIALIZER });
  return transferring;
};

export const createExchangingTransferring = async () => {
  const transferring = await ExchangingTransferringContract.new();
  await transferring.initializeExchangingTestTransfer({ from: INITIALIZER });
  return transferring;
};

interface TransferOptions {
  superAdmin?: string;
  admin?: string;
  transferAgent?: string;
  usingOwner?: boolean;
}

export interface TransferTokenOptions extends TransferOptions {
  withExchange?: boolean;
}

export const shouldTransferToken = (create: () => any, options: TransferTokenOptions = {}) => {
  const withExchange = Boolean(options.withExchange);
  const superAdmin = options.superAdmin || INITIALIZER;
  const usingOwner = Boolean(options.usingOwner);
  const admin = options.admin || superAdmin;
  const transferAgent = options.transferAgent || superAdmin;
  const invalidRoleError = buildInvalidRoleError(usingOwner);

  it('should transfer consumable to another address', async () => {
    const transferring = await create();

    const consumable = await createConsumable();
    await mintConsumable(consumable, transferring.address, 1000);

    await transferring.transferToken(consumable.address, 100, PLAYER3, { from: transferAgent });

    expect(await getBalance(consumable, transferring.address)).toEqual(900);
    expect(await getBalance(consumable, PLAYER3)).toEqual(100);
  });

  if (withExchange) {
    it('should transfer convertible consumable to another address', async () => {
      const transferring = await create();

      const exchangeConsumable = await createConsumableExchange({ name: 'Exchange' });
      const consumable = await createConvertibleConsumable(exchangeConsumable.address, { name: 'Consumable' }, '', 10);

      await mintConsumable(exchangeConsumable, transferring.address, 1000);

      await transferring.transferToken(consumable.address, 100, PLAYER3, { from: transferAgent });

      expect(await getBalance(exchangeConsumable, transferring.address)).toEqual(990);
      expect(await getBalance(exchangeConsumable, PLAYER3)).toEqual(0);
      expect(await getBalance(consumable, transferring.address)).toEqual(0);
      expect(await getBalance(consumable, PLAYER3)).toEqual(100);

      await transferring.transferToken(consumable.address, 101, PLAYER3, { from: transferAgent });

      expect(await getBalance(exchangeConsumable, transferring.address)).toEqual(979);
      expect(await getBalance(exchangeConsumable, PLAYER3)).toEqual(0);
      expect(await getBalance(consumable, transferring.address)).toEqual(0);
      expect(await getBalance(consumable, PLAYER3)).toEqual(201);
    });
  }

  it('should not transfer if not enough consumable', async () => {
    const transferring = await create();

    const consumable = await createConsumable();
    await mintConsumable(consumable, transferring.address, 99);

    await expectRevert(
      transferring.transferToken(consumable.address, 100, PLAYER3, { from: transferAgent }),
      'transfer amount exceeds balance',
    );

    expect(await getBalance(consumable, transferring.address)).toEqual(99);
    expect(await getBalance(consumable, PLAYER3)).toEqual(0);
  });

  if (withExchange) {
    it('should not transfer convertible consumable if not enough exchange', async () => {
      const transferring = await create();

      const exchangeConsumable = await createConsumableExchange({ name: 'Exchange' });
      const consumable = await createConvertibleConsumable(exchangeConsumable.address, { name: 'Consumable' }, '', 10);

      await mintConsumable(exchangeConsumable, consumable.address, 10);
      await mintConsumable(consumable, transferring.address, 99);

      await expectRevert(
        transferring.transferToken(consumable.address, 100, PLAYER3, { from: transferAgent }),
        'transfer amount exceeds balance',
      );

      expect(await getBalance(exchangeConsumable, transferring.address)).toEqual(0);
      expect(await getBalance(exchangeConsumable, PLAYER3)).toEqual(0);

      expect(await getBalance(consumable, transferring.address)).toEqual(99);
      expect(await getBalance(consumable, PLAYER3)).toEqual(0);
    });
  }

  it('should not transfer if caller is not transfer agent', async () => {
    const transferring = await create();

    const consumable = await createConsumable();
    await mintConsumable(consumable, transferring.address, 1000);

    await expectRevert(
      transferring.transferToken(consumable.address, 100, PLAYER3, { from: PLAYER3 }),
      invalidRoleError,
    );

    expect(await getBalance(consumable, transferring.address)).toEqual(1000);
    expect(await getBalance(consumable, PLAYER3)).toEqual(0);
  });

  it('should not transfer if transfer is disabled', async () => {
    const transferring = await create();

    const consumable = await createConsumable();
    await mintConsumable(consumable, transferring.address, 1000);

    await disableContract(transferring, admin);

    await expectRevert(
      transferring.transferToken(consumable.address, 100, PLAYER3, { from: transferAgent }),
      'Contract is disabled',
    );

    expect(await getBalance(consumable, transferring.address)).toEqual(1000);
    expect(await getBalance(consumable, PLAYER3)).toEqual(0);
  });
};

export const shouldTransferItem = (create: () => any, options: TransferOptions = {}) => {
  const superAdmin = options.superAdmin || INITIALIZER;
  const usingOwner = Boolean(options.usingOwner);
  const admin = usingOwner ? superAdmin : superAdmin;
  const transferAgent = usingOwner ? superAdmin : superAdmin;
  const invalidRoleError = buildInvalidRoleError(usingOwner);

  it('should transfer item to another address', async () => {
    const transferring = await create();

    const artifact = await createArtifact();
    await mintItem(artifact, transferring.address);
    await mintItem(artifact, transferring.address);

    await transferring.transferItem(artifact.address, 1, PLAYER3, { from: transferAgent });

    expect(await artifact.ownerOf(1)).toEqual(PLAYER3);
    expect(await artifact.ownerOf(2)).toEqual(transferring.address);
  });

  it('should not transfer if not valid item', async () => {
    const transferring = await create();

    const artifact = await createArtifact();
    await mintItem(artifact, transferring.address);

    await expectRevert(
      transferring.transferItem(artifact.address, 2, PLAYER3, { from: transferAgent }),
      'operator query for nonexistent token',
    );

    expect(await artifact.ownerOf(1)).toEqual(transferring.address);
  });

  it('should not transfer if caller is not transfer agent', async () => {
    const transferring = await create();

    const artifact = await createArtifact();
    await mintItem(artifact, transferring.address);

    await expectRevert(transferring.transferItem(artifact.address, 1, PLAYER3, { from: PLAYER3 }), invalidRoleError);

    expect(await artifact.ownerOf(1)).toEqual(transferring.address);
  });

  it('should not transfer if transfer is disabled', async () => {
    const transferring = await create();

    const artifact = await createArtifact();
    await mintItem(artifact, transferring.address);

    await disableContract(transferring, admin);

    await expectRevert(
      transferring.transferItem(artifact.address, 1, PLAYER3, { from: transferAgent }),
      'Contract is disabled',
    );

    expect(await artifact.ownerOf(1)).toEqual(transferring.address);
  });
};

const buildInvalidRoleError = (usingOwner: boolean) =>
  usingOwner ? 'caller is not the owner' : 'Caller does not have the Transfer Agent role';
