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

import { ContractTransaction } from 'ethers';
import { hexlify, Interface } from 'ethers/lib/utils';
import { buildAccessControlAddMembersInitFunction } from '../../../../src/contracts/access';
import { ZERO_ADDRESS } from '../../../../src/contracts/accounts';
import {
  buildDiamondFacetCut,
  DiamondFacetCutAction,
  emptyDiamondInitFunction,
} from '../../../../src/contracts/diamonds';
import { DIAMOND_LOUPE_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { IAccessCheck__factory, IDiamondLoupe__factory, IERC165__factory } from '../../../../types/contracts';
import { DISABLER, INITIALIZER, PLAYER1 } from '../../../helpers/Accounts';
import { createDiamond } from '../../../helpers/DiamondHelper';
import { createAccessControl, deployAccessControlInit } from '../../../helpers/facets/AccessControlFacetHelper';
import { asDiamondCut, deployDiamondLoupeFacet } from '../../../helpers/facets/DiamondFacetHelper';
import { createDisableable } from '../../../helpers/facets/DisableableFacetHelper';
import { ROLE1 } from '../../../helpers/RoleIds';

describe('add', () => {
  it('should add functions', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();

    const diamond = await createDiamond();

    await asDiamondCut(diamond).diamondCut([buildDiamondFacetCut(loupeFacet)], emptyDiamondInitFunction);

    const loupe = IDiamondLoupe__factory.connect(diamond.address, INITIALIZER);

    expect<string>(await loupe.facetAddress(Interface.getSighash(loupeFacet.interface.functions['facets()']))).toEqual(
      loupeFacet.address,
    );
    expect<number>((await loupe.facetFunctionSelectors(loupeFacet.address)).length).toEqual(4);
  });

  it('should call init function', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();
    const accessControlInit = await deployAccessControlInit();

    const diamond = await createDiamond();

    await asDiamondCut(diamond).diamondCut(
      [buildDiamondFacetCut(loupeFacet)],
      buildAccessControlAddMembersInitFunction(accessControlInit, [{ role: ROLE1, members: [PLAYER1.address] }]),
    );

    const accessCheck = IAccessCheck__factory.connect(diamond.address, INITIALIZER);

    expect<boolean>(await accessCheck.hasRole(ROLE1, PLAYER1.address)).toBe(true);
  });

  it('should add interface', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();

    const diamond = await createDiamond();

    await asDiamondCut(diamond).diamondCut([buildDiamondFacetCut(loupeFacet)], emptyDiamondInitFunction);

    const erc165 = IERC165__factory.connect(diamond.address, INITIALIZER);

    expect<boolean>(await erc165.supportsInterface(DIAMOND_LOUPE_INTERFACE_ID)).toBe(true);
  });

  it('should emit DiamondCut event', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();

    const diamond = await createDiamond();

    const diamondCutter = asDiamondCut(diamond);

    const loupeCut = buildDiamondFacetCut(loupeFacet);
    await expect<ContractTransaction>(
      await diamondCutter.diamondCut([loupeCut], emptyDiamondInitFunction),
    ).toHaveEmittedWith(diamondCutter, 'DiamondCut', [
      [[loupeCut.facetAddress, loupeCut.action, loupeCut.functionSelectors, hexlify(loupeCut.interfaceId)]],
      [ZERO_ADDRESS, '0x'],
    ]);
  });

  it('should revert if function already exists', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();

    const diamond = await createDiamond({ additionalCuts: [buildDiamondFacetCut(loupeFacet)] });

    await expect<Promise<ContractTransaction>>(
      asDiamondCut(diamond).diamondCut([buildDiamondFacetCut(loupeFacet)], emptyDiamondInitFunction),
    ).toBeRevertedWith('Cannot add function that already exists');
  });

  it('should revert if not called by diamond cutter', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();

    const diamond = await createDiamond();

    await expect<Promise<ContractTransaction>>(
      asDiamondCut(diamond, INITIALIZER).diamondCut([buildDiamondFacetCut(loupeFacet)], emptyDiamondInitFunction),
    ).toBeRevertedWith('missing role');

    await expect<Promise<ContractTransaction>>(
      asDiamondCut(diamond, PLAYER1).diamondCut([buildDiamondFacetCut(loupeFacet)], emptyDiamondInitFunction),
    ).toBeRevertedWith('missing role');
  });
});

describe('replace', () => {
  it('should replace functions', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();
    const loupeFacet2 = await deployDiamondLoupeFacet();

    const diamond = await createDiamond({ additionalCuts: [buildDiamondFacetCut(loupeFacet)] });

    await asDiamondCut(diamond).diamondCut(
      [buildDiamondFacetCut(loupeFacet2, DiamondFacetCutAction.Replace)],
      emptyDiamondInitFunction,
    );

    const loupe = IDiamondLoupe__factory.connect(diamond.address, INITIALIZER);

    expect<string>(await loupe.facetAddress(Interface.getSighash(loupeFacet.interface.functions['facets()']))).toEqual(
      loupeFacet2.address,
    );
    expect<number>((await loupe.facetFunctionSelectors(loupeFacet.address)).length).toEqual(0);
    expect<number>((await loupe.facetFunctionSelectors(loupeFacet2.address)).length).toEqual(4);
  });

  it('should call init function', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();
    const loupeFacet2 = await deployDiamondLoupeFacet();
    const accessControlInit = await deployAccessControlInit();

    const diamond = await createDiamond({ additionalCuts: [buildDiamondFacetCut(loupeFacet)] });

    await asDiamondCut(diamond).diamondCut(
      [buildDiamondFacetCut(loupeFacet2, DiamondFacetCutAction.Replace)],
      buildAccessControlAddMembersInitFunction(accessControlInit, [{ role: ROLE1, members: [PLAYER1.address] }]),
    );

    const accessCheck = IAccessCheck__factory.connect(diamond.address, INITIALIZER);

    expect<boolean>(await accessCheck.hasRole(ROLE1, PLAYER1.address)).toBe(true);
  });

  it('should not add the interface', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();
    const loupeFacet2 = await deployDiamondLoupeFacet();

    const diamond = await createDiamond({
      additionalCuts: [{ ...buildDiamondFacetCut(loupeFacet), interfaceId: '0x00000000' }],
    });

    await asDiamondCut(diamond).diamondCut(
      [buildDiamondFacetCut(loupeFacet2, DiamondFacetCutAction.Replace)],
      emptyDiamondInitFunction,
    );

    const erc165 = IERC165__factory.connect(diamond.address, INITIALIZER);

    expect<boolean>(await erc165.supportsInterface(DIAMOND_LOUPE_INTERFACE_ID)).toBe(false);
  });

  it('should not remove the interface', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();
    const loupeFacet2 = await deployDiamondLoupeFacet();

    const diamond = await createDiamond({
      additionalCuts: [buildDiamondFacetCut(loupeFacet)],
    });

    await asDiamondCut(diamond).diamondCut(
      [buildDiamondFacetCut(loupeFacet2, DiamondFacetCutAction.Replace)],
      emptyDiamondInitFunction,
    );

    const erc165 = IERC165__factory.connect(diamond.address, INITIALIZER);

    expect<boolean>(await erc165.supportsInterface(DIAMOND_LOUPE_INTERFACE_ID)).toBe(true);
  });

  it('should emit DiamondCut event', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();
    const loupeFacet2 = await deployDiamondLoupeFacet();

    const diamond = await createDiamond({ additionalCuts: [buildDiamondFacetCut(loupeFacet)] });

    const diamondCutter = asDiamondCut(diamond);

    const loupeCut = buildDiamondFacetCut(loupeFacet2, DiamondFacetCutAction.Replace);
    await expect<ContractTransaction>(
      await diamondCutter.diamondCut([loupeCut], emptyDiamondInitFunction),
    ).toHaveEmittedWith(diamondCutter, 'DiamondCut', [
      [[loupeCut.facetAddress, loupeCut.action, loupeCut.functionSelectors, hexlify(loupeCut.interfaceId)]],
      [ZERO_ADDRESS, '0x'],
    ]);
  });

  it('should revert if any functions missing', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();

    const diamond = await createDiamond();

    await expect<Promise<ContractTransaction>>(
      asDiamondCut(diamond).diamondCut(
        [buildDiamondFacetCut(loupeFacet, DiamondFacetCutAction.Replace)],
        emptyDiamondInitFunction,
      ),
    ).toBeRevertedWith('Cannot replace function that does not exist');
  });

  it('should revert if replacing with the same facet', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();

    const diamond = await createDiamond({ additionalCuts: [buildDiamondFacetCut(loupeFacet)] });

    await expect<Promise<ContractTransaction>>(
      asDiamondCut(diamond).diamondCut(
        [buildDiamondFacetCut(loupeFacet, DiamondFacetCutAction.Replace)],
        emptyDiamondInitFunction,
      ),
    ).toBeRevertedWith('Cannot replace function with same function');
  });

  it('should revert if not called by diamond cutter', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();

    const diamond = await createDiamond({ additionalCuts: [buildDiamondFacetCut(loupeFacet)] });

    await expect<Promise<ContractTransaction>>(
      asDiamondCut(diamond, INITIALIZER).diamondCut(
        [buildDiamondFacetCut(loupeFacet, DiamondFacetCutAction.Replace)],
        emptyDiamondInitFunction,
      ),
    ).toBeRevertedWith('missing role');

    await expect<Promise<ContractTransaction>>(
      asDiamondCut(diamond, PLAYER1).diamondCut(
        [buildDiamondFacetCut(loupeFacet, DiamondFacetCutAction.Replace)],
        emptyDiamondInitFunction,
      ),
    ).toBeRevertedWith('missing role');
  });
});

describe('remove', () => {
  it('should remove functions', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();

    const diamond = await createDiamond({ additionalCuts: [buildDiamondFacetCut(loupeFacet)] });

    await asDiamondCut(diamond).diamondCut(
      [buildDiamondFacetCut(loupeFacet, DiamondFacetCutAction.Remove)],
      emptyDiamondInitFunction,
    );

    const loupe = IDiamondLoupe__factory.connect(diamond.address, INITIALIZER);

    expect<Promise<string>>(loupe.facetAddress(ZERO_ADDRESS)).toBeRevertedWith('Diamond: Function does not exist');
    expect<Promise<string[]>>(loupe.facetFunctionSelectors(loupeFacet.address)).toBeRevertedWith(
      'Diamond: Function does not exist',
    );
  });

  it('should call init function', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();
    const accessControlInit = await deployAccessControlInit();

    const diamond = await createDiamond({ additionalCuts: [buildDiamondFacetCut(loupeFacet)] });

    await asDiamondCut(diamond).diamondCut(
      [buildDiamondFacetCut(loupeFacet, DiamondFacetCutAction.Remove)],
      buildAccessControlAddMembersInitFunction(accessControlInit, [{ role: ROLE1, members: [PLAYER1.address] }]),
    );

    const accessCheck = IAccessCheck__factory.connect(diamond.address, INITIALIZER);

    expect<boolean>(await accessCheck.hasRole(ROLE1, PLAYER1.address)).toBe(true);
  });

  it('should remove interface', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();

    const diamond = await createDiamond({ additionalCuts: [buildDiamondFacetCut(loupeFacet)] });

    await asDiamondCut(diamond).diamondCut(
      [buildDiamondFacetCut(loupeFacet, DiamondFacetCutAction.Remove)],
      emptyDiamondInitFunction,
    );

    const erc165 = IERC165__factory.connect(diamond.address, INITIALIZER);

    expect<boolean>(await erc165.supportsInterface(DIAMOND_LOUPE_INTERFACE_ID)).toBe(false);
  });

  it('should emit DiamondCut event', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();

    const diamond = await createDiamond({ additionalCuts: [buildDiamondFacetCut(loupeFacet)] });

    const diamondCutter = asDiamondCut(diamond);

    const loupeCut = buildDiamondFacetCut(loupeFacet, DiamondFacetCutAction.Remove);
    await expect<ContractTransaction>(
      await diamondCutter.diamondCut([loupeCut], emptyDiamondInitFunction),
    ).toHaveEmittedWith(diamondCutter, 'DiamondCut', [
      [[loupeCut.facetAddress, loupeCut.action, loupeCut.functionSelectors, hexlify(loupeCut.interfaceId)]],
      [ZERO_ADDRESS, '0x'],
    ]);
  });

  it('should revert if any functions missing', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();

    const diamond = await createDiamond();

    await expect<Promise<ContractTransaction>>(
      asDiamondCut(diamond).diamondCut(
        [buildDiamondFacetCut(loupeFacet, DiamondFacetCutAction.Remove)],
        emptyDiamondInitFunction,
      ),
    ).toBeRevertedWith('Cannot remove function that does not exist');
  });

  it('should revert if not called by diamond cutter', async () => {
    const loupeFacet = await deployDiamondLoupeFacet();

    const diamond = await createDiamond({ additionalCuts: [buildDiamondFacetCut(loupeFacet)] });

    await expect<Promise<ContractTransaction>>(
      asDiamondCut(diamond, INITIALIZER).diamondCut(
        [buildDiamondFacetCut(loupeFacet, DiamondFacetCutAction.Remove)],
        emptyDiamondInitFunction,
      ),
    ).toBeRevertedWith('missing role');

    await expect<Promise<ContractTransaction>>(
      asDiamondCut(diamond, PLAYER1).diamondCut(
        [buildDiamondFacetCut(loupeFacet, DiamondFacetCutAction.Remove)],
        emptyDiamondInitFunction,
      ),
    ).toBeRevertedWith('missing role');
  });
});

describe('interaction with other contracts', () => {
  describe('DelegateAccessControl', () => {
    it('should succeed when delegating access', async () => {
      const loupeFacet = await deployDiamondLoupeFacet();

      const accessControl = await createAccessControl();

      const diamond = await createDiamond({ delegate: accessControl });

      await asDiamondCut(diamond).diamondCut([buildDiamondFacetCut(loupeFacet)], emptyDiamondInitFunction);

      const loupe = IDiamondLoupe__factory.connect(diamond.address, INITIALIZER);

      expect<string>(
        await loupe.facetAddress(Interface.getSighash(loupeFacet.interface.functions['facets()'])),
      ).toEqual(loupeFacet.address);
      expect<number>((await loupe.facetFunctionSelectors(loupeFacet.address)).length).toEqual(4);
    });

    it('should revert if not called by diamond cutter when delegating access', async () => {
      const loupeFacet = await deployDiamondLoupeFacet();

      const accessControl = await createAccessControl();

      const diamond = await createDiamond({ delegate: accessControl });

      await expect<Promise<ContractTransaction>>(
        asDiamondCut(diamond, INITIALIZER).diamondCut([buildDiamondFacetCut(loupeFacet)], emptyDiamondInitFunction),
      ).toBeRevertedWith('missing role');

      await expect<Promise<ContractTransaction>>(
        asDiamondCut(diamond, PLAYER1).diamondCut([buildDiamondFacetCut(loupeFacet)], emptyDiamondInitFunction),
      ).toBeRevertedWith('missing role');
    });
  });

  describe('Disableable', () => {
    it('should succeed when disableable', async () => {
      const loupeFacet = await deployDiamondLoupeFacet();

      const diamond = await createDisableable();

      await asDiamondCut(diamond).diamondCut([buildDiamondFacetCut(loupeFacet)], emptyDiamondInitFunction);

      const loupe = IDiamondLoupe__factory.connect(diamond.address, INITIALIZER);

      expect<string>(
        await loupe.facetAddress(Interface.getSighash(loupeFacet.interface.functions['facets()'])),
      ).toEqual(loupeFacet.address);
      expect<number>((await loupe.facetFunctionSelectors(loupeFacet.address)).length).toEqual(4);
    });

    it('should revert when disableable and disabled', async () => {
      const loupeFacet = await deployDiamondLoupeFacet();

      const diamond = await createDisableable();

      await diamond.connect(DISABLER).disable();

      await expect<Promise<ContractTransaction>>(
        asDiamondCut(diamond).diamondCut([buildDiamondFacetCut(loupeFacet)], emptyDiamondInitFunction),
      ).toBeRevertedWith('Contract is disabled');
    });
  });
});
