/*
 * Copyright (c) 2020 The Paypr Company, LLC
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

import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import 'hardhat-typechain';

import { ITypeChainCfg } from 'typechain/dist/TypeChain';

type HardhatConfig = HardhatUserConfig & {
  typechain: TypeChainConfig;
};

type TypeChainConfig = ITypeChainCfg & {
  runOnCompile?: boolean;
};

const hardhatConfig: HardhatConfig = {
  solidity: {
    version: '0.8.3',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  typechain: {
    outDir: 'types/contracts',
    target: 'ethers-v5',
    runOnCompile: true,
  },
};

export default hardhatConfig;
