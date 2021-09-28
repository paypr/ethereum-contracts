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

import { Contract, Signer } from 'ethers';
import { AccessRoleAdmins } from '../../../src/contracts/access';
import { ConsumableAmount, ConsumableAmountBN } from '../../../src/contracts/consumables';
import { buildDiamondFacetCut, DiamondFacetCut } from '../../../src/contracts/diamonds';
import { MINTER_ROLE, SUPER_ADMIN_ROLE } from '../../../src/contracts/roles';
import {
  ConsumableFacet__factory,
  ConsumableMintFacet__factory,
  IConsumable__factory,
  IConsumableMint__factory,
} from '../../../types/contracts';
import { CONSUMABLE_MINTER, INITIALIZER } from '../Accounts';
import { combineExtensibleDiamondOptions, createDiamond, ExtensibleDiamondOptions } from '../DiamondHelper';
import { buildDisableableDiamondAdditions } from './DisableableFacetHelper';

export const asConsumable = (contract: Contract, signer: Signer = INITIALIZER) =>
  IConsumable__factory.connect(contract.address, signer);

export const asConsumableMint = (contract: Contract, signer: Signer = CONSUMABLE_MINTER) =>
  IConsumableMint__factory.connect(contract.address, signer);

export interface CreateConsumableOptions extends ExtensibleDiamondOptions {}

export const createConsumable = async (options: CreateConsumableOptions = {}) =>
  asConsumable(
    await createDiamond(
      combineExtensibleDiamondOptions(
        {
          additionalCuts: [
            buildDiamondFacetCut(await deployConsumableFacet()),
            buildDiamondFacetCut(await deployConsumableMintFacet()),
          ],
          additionalRoleAdmins: [
            { role: SUPER_ADMIN_ROLE, admins: [INITIALIZER.address] },
            { role: MINTER_ROLE, admins: [CONSUMABLE_MINTER.address] },
          ],
        },
        options,
      ),
    ),
  );

export const createDisableableConsumable = async () => await createConsumable(await buildDisableableDiamondAdditions());

export const combineConsumableAdditions = (...additions: ExtensibleDiamondOptions[]): ExtensibleDiamondOptions => {
  const additionalCuts: DiamondFacetCut[] = [];
  const additionalRoleAdmins: AccessRoleAdmins[] = [];

  additions.forEach((addition) => {
    addition.additionalCuts?.forEach((cut) => additionalCuts.push(cut));
    addition.additionalRoleAdmins?.forEach((admins) => additionalRoleAdmins.push(admins));
  });

  return { additionalCuts, additionalRoleAdmins };
};

export const deployConsumableFacet = () => new ConsumableFacet__factory(INITIALIZER).deploy();
export const deployConsumableMintFacet = () => new ConsumableMintFacet__factory(INITIALIZER).deploy();

export const toConsumableAmount = (consumableAmount: ConsumableAmountBN): ConsumableAmount => {
  const { consumable, amount } = consumableAmount;
  return { consumable, amount: amount.toNumber() };
};

export const toConsumableAmountAsync = async (
  consumableAmount: Promise<ConsumableAmountBN> | ConsumableAmountBN,
): Promise<ConsumableAmount> => toConsumableAmount(await consumableAmount);
