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

import { ERC165Init } from '../../types/contracts';
import { DiamondInitFunction } from './diamonds';
import { toErc165InterfaceId } from './erc165InterfaceIds';

export type Erc165InterfaceId = string;

export const NO_INTERFACE = toErc165InterfaceId(0);

export const buildErc165SetSupportedInterfacesDiamondInitFunction = (
  erc165Init: ERC165Init,
  interfaceIds: Erc165InterfaceId[],
): DiamondInitFunction => ({
  initAddress: erc165Init.address,
  callData: encodeErc165SetSupportedInterfacesCallData(erc165Init, interfaceIds),
});

export const encodeErc165SetSupportedInterfacesCallData = (erc165Init: ERC165Init, interfaceIds: Erc165InterfaceId[]) =>
  erc165Init.interface.encodeFunctionData('setSupportedInterfaces', [interfaceIds]);

export const buildErc165ClearSupportedInterfacesDiamondInitFunction = (
  erc165Init: ERC165Init,
  interfaceIds: Erc165InterfaceId[],
): DiamondInitFunction => ({
  initAddress: erc165Init.address,
  callData: encodeErc165ClearSupportedInterfacesCallData(erc165Init, interfaceIds),
});

export const encodeErc165ClearSupportedInterfacesCallData = (
  erc165Init: ERC165Init,
  interfaceIds: Erc165InterfaceId[],
) => erc165Init.interface.encodeFunctionData('clearSupportedInterfaces', [interfaceIds]);
