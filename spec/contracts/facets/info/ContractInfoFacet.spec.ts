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

import {
  buildContractInfoInitializeInitFunction,
  buildContractInfoSetDescriptionInitFunction,
  buildContractInfoSetIncludeAddressInUriInitFunction,
  buildContractInfoSetNameInitFunction,
  buildContractInfoSetSymbolInitFunction,
  buildContractInfoSetUriInitFunction,
} from '../../../../src/contracts/contractInfo';
import { buildDiamondFacetCut } from '../../../../src/contracts/diamonds';
import { CONTRACT_INFO_INTERFACE_ID } from '../../../../src/contracts/erc165InterfaceIds';
import { combineDiamondInitFunctions, createDiamond, deployDiamond } from '../../../helpers/DiamondHelper';
import { shouldSupportInterface } from '../../../helpers/ERC165Helper';
import {
  asContractInfo,
  deployContractInfoFacet,
  deployContractInfoInit,
} from '../../../helpers/facets/ContractInfoFacetHelper';
import { asErc165, deployErc165Facet } from '../../../helpers/facets/ERC165FacetHelper';

describe('supportsInterface', () => {
  const createDiamondForErc165 = async () =>
    asErc165(
      await deployDiamond([
        buildDiamondFacetCut(await deployErc165Facet()),
        buildDiamondFacetCut(await deployContractInfoFacet()),
      ]),
    );

  shouldSupportInterface('ContractInfo', createDiamondForErc165, CONTRACT_INFO_INTERFACE_ID);
});

describe('getName', () => {
  it('should return blank when uninitialized', async () => {
    const contractInfo = asContractInfo(
      await createDiamond({ additionalCuts: [buildDiamondFacetCut(await deployContractInfoFacet())] }),
    );

    expect<string>(await contractInfo.name()).toEqual('');
  });

  it('should return the name when initialized', async () => {
    const contractInfo = asContractInfo(
      await createDiamond({
        additionalCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
        additionalInits: [buildContractInfoSetNameInitFunction(await deployContractInfoInit(), 'the name')],
      }),
    );

    expect<string>(await contractInfo.name()).toEqual('the name');
  });

  it('should return the name when initialized fully', async () => {
    const contractInfo = asContractInfo(
      await createDiamond({
        additionalCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
        additionalInits: [
          buildContractInfoInitializeInitFunction(await deployContractInfoInit(), {
            name: 'the name',
            symbol: 'the symbol',
            description: 'the description',
            uri: 'the uri',
          }),
        ],
      }),
    );

    expect<string>(await contractInfo.name()).toEqual('the name');
  });
});

describe('getSymbol', () => {
  it('should return blank when uninitialized', async () => {
    const contractInfo = asContractInfo(
      await createDiamond({ additionalCuts: [buildDiamondFacetCut(await deployContractInfoFacet())] }),
    );

    expect<string>(await contractInfo.symbol()).toEqual('');
  });

  it('should return the symbol when initialized', async () => {
    const contractInfo = asContractInfo(
      await createDiamond({
        additionalCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
        additionalInits: [buildContractInfoSetSymbolInitFunction(await deployContractInfoInit(), 'the symbol')],
      }),
    );

    expect<string>(await contractInfo.symbol()).toEqual('the symbol');
  });

  it('should return the symbol when initialized fully', async () => {
    const contractInfo = asContractInfo(
      await createDiamond({
        additionalCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
        additionalInits: [
          buildContractInfoInitializeInitFunction(await deployContractInfoInit(), {
            name: 'the name',
            symbol: 'the symbol',
            description: 'the description',
            uri: 'the uri',
          }),
        ],
      }),
    );

    expect<string>(await contractInfo.symbol()).toEqual('the symbol');
  });
});

describe('getDescription', () => {
  it('should return blank when uninitialized', async () => {
    const contractInfo = asContractInfo(
      await createDiamond({ additionalCuts: [buildDiamondFacetCut(await deployContractInfoFacet())] }),
    );

    expect<string>(await contractInfo.description()).toEqual('');
  });

  it('should return the description when initialized', async () => {
    const contractInfo = asContractInfo(
      await createDiamond({
        additionalCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
        additionalInits: [
          buildContractInfoSetDescriptionInitFunction(await deployContractInfoInit(), 'the description'),
        ],
      }),
    );

    expect<string>(await contractInfo.description()).toEqual('the description');
  });

  it('should return the description when initialized fully', async () => {
    const contractInfo = asContractInfo(
      await createDiamond({
        additionalCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
        additionalInits: [
          buildContractInfoInitializeInitFunction(await deployContractInfoInit(), {
            name: 'the name',
            symbol: 'the symbol',
            description: 'the description',
            uri: 'the uri',
          }),
        ],
      }),
    );

    expect<string>(await contractInfo.description()).toEqual('the description');
  });
});

describe('getUri', () => {
  it('should return blank when uninitialized', async () => {
    const contractInfo = asContractInfo(
      await createDiamond({ additionalCuts: [buildDiamondFacetCut(await deployContractInfoFacet())] }),
    );

    expect<string>(await contractInfo.uri()).toEqual('');
  });

  it('should return blank when empty and including address', async () => {
    const contractInfo = asContractInfo(
      await createDiamond({
        additionalCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
        additionalInits: [buildContractInfoSetIncludeAddressInUriInitFunction(await deployContractInfoInit(), true)],
      }),
    );

    expect<string>(await contractInfo.uri()).toEqual('');
  });

  it('should return the uri when initialized', async () => {
    const contractInfo = asContractInfo(
      await createDiamond({
        additionalCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
        additionalInits: [buildContractInfoSetUriInitFunction(await deployContractInfoInit(), 'the uri')],
      }),
    );

    expect<string>(await contractInfo.uri()).toEqual('the uri');
  });

  it('should return the uri with address when initialized to include address', async () => {
    const contractInfoInit = await deployContractInfoInit();
    const contractInfo = asContractInfo(
      await createDiamond({
        additionalCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
        additionalInits: [
          await combineDiamondInitFunctions([
            buildContractInfoSetUriInitFunction(contractInfoInit, 'the uri/'),
            buildContractInfoSetIncludeAddressInUriInitFunction(contractInfoInit, true),
          ]),
        ],
      }),
    );

    expect<string>(await contractInfo.uri()).toEqualCaseInsensitive(`the uri/${contractInfo.address}`);
  });

  it('should return the uri when initialized fully', async () => {
    const contractInfo = asContractInfo(
      await createDiamond({
        additionalCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
        additionalInits: [
          buildContractInfoInitializeInitFunction(await deployContractInfoInit(), {
            name: 'the name',
            symbol: 'the symbol',
            description: 'the description',
            uri: 'the uri',
          }),
        ],
      }),
    );

    expect<string>(await contractInfo.uri()).toEqual('the uri');
  });

  it('should return the uri with address when initialized fully', async () => {
    const contractInfo = asContractInfo(
      await createDiamond({
        additionalCuts: [buildDiamondFacetCut(await deployContractInfoFacet())],
        additionalInits: [
          buildContractInfoInitializeInitFunction(await deployContractInfoInit(), {
            name: 'the name',
            symbol: 'the symbol',
            description: 'the description',
            uri: 'the uri/',
            includeAddressInUri: true,
          }),
        ],
      }),
    );

    expect<string>(await contractInfo.uri()).toEqualCaseInsensitive(`the uri/${contractInfo.address}`);
  });
});
