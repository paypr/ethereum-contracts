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
import { withDefaultContractInfo } from '../../../../src/contracts/core/contractInfo';
import { createRolesWithAllSameRole } from '../../../helpers/AccessHelper';
import { ARTIFACT_MINTER, getContractAddress, PLAYER1, PLAYER3 } from '../../../helpers/Accounts';
import { ArtifactContract, createArtifact, mintItem } from '../../../helpers/ArtifactHelper';
import { createConsumable, getBalance, mintConsumable } from '../../../helpers/ConsumableHelper';
import { toNumberAsync } from '../../../helpers/ContractHelper';
import { disableContract, shouldRestrictEnableAndDisable } from '../../../helpers/DisableableHelper';
import { shouldTransferItem, shouldTransferToken } from '../../../helpers/TransferringHelper';

describe('initializeArtifact', () => {
  it('should set the name', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(ARTIFACT_MINTER));

    const artifact = await ArtifactContract.new();
    await artifact.initializeArtifact(withDefaultContractInfo({ name: 'the name' }), '', '', [], 1, roleDelegate, {
      from: ARTIFACT_MINTER,
    });

    expect<string>(await artifact.name()).toEqual('the name');
    expect<string>(await artifact.contractName()).toEqual('the name');
  });

  it('should set the description', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(ARTIFACT_MINTER));

    const artifact = await ArtifactContract.new();
    await artifact.initializeArtifact(
      withDefaultContractInfo({ description: 'the description' }),
      '',
      '',
      [],
      1,
      roleDelegate,
      {
        from: ARTIFACT_MINTER,
      },
    );

    expect<string>(await artifact.contractDescription()).toEqual('the description');
  });

  it('should set the uri', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(ARTIFACT_MINTER));

    const artifact = await ArtifactContract.new();
    await artifact.initializeArtifact(withDefaultContractInfo({ uri: 'the uri' }), '', '', [], 1, roleDelegate, {
      from: ARTIFACT_MINTER,
    });

    expect<string>(await artifact.contractUri()).toEqual('the uri');
  });

  it('should set the base token uri', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(ARTIFACT_MINTER));

    const artifact = await ArtifactContract.new();
    await artifact.initializeArtifact(withDefaultContractInfo({}), 'the base token uri', '', [], 1, roleDelegate, {
      from: ARTIFACT_MINTER,
    });

    expect<string>(await artifact.baseURI()).toEqual('the base token uri');
  });

  it('should set the symbol', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(ARTIFACT_MINTER));

    const artifact = await ArtifactContract.new();
    await artifact.initializeArtifact(withDefaultContractInfo({}), '', 'the symbol', [], 1, roleDelegate, {
      from: ARTIFACT_MINTER,
    });

    expect<string>(await artifact.symbol()).toEqual('the symbol');
  });

  it('should set the provided amounts', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(ARTIFACT_MINTER));

    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });
    const consumable3 = await createConsumable({ name: 'Consumable 3' });

    const artifact = await ArtifactContract.new();
    await artifact.initializeArtifact(
      withDefaultContractInfo({}),
      '',
      '',
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
      1,
      roleDelegate,
      { from: ARTIFACT_MINTER },
    );

    expect<number>(await toNumberAsync(artifact.amountProvided(consumable1.address))).toEqual(100);
    expect<number>(await toNumberAsync(artifact.amountProvided(consumable2.address))).toEqual(200);
    expect<number>(await toNumberAsync(artifact.amountProvided(consumable3.address))).toEqual(0);
  });

  it('should revert if called twice', async () => {
    const roleDelegate = await getContractAddress(createRolesWithAllSameRole(ARTIFACT_MINTER));

    const artifact = await ArtifactContract.new();
    await artifact.initializeArtifact(withDefaultContractInfo({ name: 'the name' }), '', '', [], 1, roleDelegate, {
      from: ARTIFACT_MINTER,
    });

    await expectRevert(
      artifact.initializeArtifact(withDefaultContractInfo({ name: 'the new name' }), '', '', [], 1, roleDelegate, {
        from: ARTIFACT_MINTER,
      }),
      'Contract instance has already been initialized',
    );

    expect<string>(await artifact.name()).toEqual('the name');
  });
});

describe('mint', () => {
  it('should give a new item to the player', async () => {
    const artifact = await createArtifact();

    await artifact.mint(PLAYER1, { from: ARTIFACT_MINTER });

    expect<string>(await artifact.ownerOf(1)).toEqual(PLAYER1);
  });

  it('should set up the token uri', async () => {
    const artifact = await createArtifact({}, 'the base token uri');

    await artifact.mint(PLAYER1, { from: ARTIFACT_MINTER });

    expect<string>(await artifact.tokenURI(1)).toEqual('the base token uri1');
  });

  it('should mint a new item when there is enough consumable', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });

    const artifact = await createArtifact({}, '', '', [
      { consumable: consumable1.address, amount: 100 },
      { consumable: consumable2.address, amount: 200 },
    ]);

    await mintConsumable(consumable1, artifact.address, 1000);
    await mintConsumable(consumable2, artifact.address, 1000);

    await artifact.mint(PLAYER1, { from: ARTIFACT_MINTER });

    expect<string>(await artifact.ownerOf(1)).toEqual(PLAYER1);

    await artifact.mint(PLAYER1, { from: ARTIFACT_MINTER });
    await artifact.mint(PLAYER1, { from: ARTIFACT_MINTER });
    await artifact.mint(PLAYER1, { from: ARTIFACT_MINTER });
    await artifact.mint(PLAYER1, { from: ARTIFACT_MINTER });
  });

  it('should not mint a new item if not enough consumables', async () => {
    const consumable1 = await createConsumable({ name: 'Consumable 1' });
    const consumable2 = await createConsumable({ name: 'Consumable 2' });

    const artifact = await createArtifact(
      {},
      '',
      '',
      [
        { consumable: consumable1.address, amount: 100 },
        { consumable: consumable2.address, amount: 200 },
      ],
      2,
    );

    await expectRevert(artifact.mint(PLAYER1, { from: ARTIFACT_MINTER }), 'not enough consumable for items');
    await expectRevert(artifact.ownerOf(1), 'ERC721: owner query for nonexistent token');

    await mintConsumable(consumable1, artifact.address, 100);
    await mintConsumable(consumable2, artifact.address, 200);

    await expectRevert(artifact.mint(PLAYER1, { from: ARTIFACT_MINTER }), 'not enough consumable for items');
    await expectRevert(artifact.ownerOf(1), 'ERC721: owner query for nonexistent token');

    await mintConsumable(consumable1, artifact.address, 100);

    await expectRevert(artifact.mint(PLAYER1, { from: ARTIFACT_MINTER }), 'not enough consumable for items');
    await expectRevert(artifact.ownerOf(1), 'ERC721: owner query for nonexistent token');

    // finally show it works
    await mintConsumable(consumable2, artifact.address, 200);

    await artifact.mint(PLAYER1, { from: ARTIFACT_MINTER });

    expect<string>(await artifact.ownerOf(1)).toEqual(PLAYER1);
  });

  it('should not mint a new item if not the minter', async () => {
    const artifact = await createArtifact();

    await expectRevert(artifact.mint(PLAYER1), 'Caller does not have the Minter role');
    await expectRevert(artifact.ownerOf(1), 'ERC721: owner query for nonexistent token');

    await expectRevert(artifact.mint(PLAYER1, { from: PLAYER1 }), 'Caller does not have the Minter role');
    await expectRevert(artifact.ownerOf(1), 'ERC721: owner query for nonexistent token');
  });

  it('should not mint if disabled', async () => {
    const artifact = await createArtifact();

    await disableContract(artifact, ARTIFACT_MINTER);

    await expectRevert(artifact.mint(PLAYER1, { from: ARTIFACT_MINTER }), 'Contract is disabled');
  });
});

describe('Enable/Disable', () => {
  shouldRestrictEnableAndDisable(createArtifact, ARTIFACT_MINTER);
});

describe('transferToken', () => {
  shouldTransferToken(createArtifact, { superAdmin: ARTIFACT_MINTER });

  it('should transfer token if enough to satisfy total uses', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });
    const artifact = await createArtifact(
      { name: 'Artifact' },
      '',
      '',
      [{ consumable: consumable.address, amount: 10 }],
      10,
    );

    await mintConsumable(consumable, artifact.address, 1000);
    await mintItem(artifact, PLAYER1);
    await mintItem(artifact, PLAYER1);

    await artifact.transferToken(consumable.address, 10, PLAYER3, { from: ARTIFACT_MINTER });

    expect(await getBalance(consumable, artifact.address)).toEqual(990);
    expect(await getBalance(consumable, PLAYER3)).toEqual(10);
  });

  it('should not transfer token if not enough to satisfy total uses', async () => {
    const consumable = await createConsumable({ name: 'Consumable' });
    const artifact = await createArtifact(
      { name: 'Artifact' },
      '',
      '',
      [{ consumable: consumable.address, amount: 10 }],
      10,
    );

    await mintConsumable(consumable, artifact.address, 200);
    await mintItem(artifact, PLAYER1);
    await mintItem(artifact, PLAYER1);

    await expectRevert(
      artifact.transferToken(consumable.address, 1, PLAYER3, { from: ARTIFACT_MINTER }),
      'not enough consumable for items',
    );
  });
});

describe('transferItem', () => {
  shouldTransferItem(createArtifact, { superAdmin: ARTIFACT_MINTER });
});
