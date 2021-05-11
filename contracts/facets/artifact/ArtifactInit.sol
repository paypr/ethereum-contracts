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

// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.8.4;

import './ArtifactImpl.sol';
import '../erc721/ERC721Impl.sol';
import '../erc721/IERC721Hooks.sol';
import '../transfer/ITransferHooks.sol';
import '../transfer/TransferImpl.sol';

contract ArtifactInit {
  struct ArtifactData {
    uint256 initialUses;
    IERC721Hooks erc721Hooks;
    ITransferHooks transferHooks;
  }

  function initialize(ArtifactData calldata data) external {
    ArtifactImpl.setInitialUses(data.initialUses);
    ERC721Impl.addHooks(data.erc721Hooks);
    TransferImpl.addHooks(data.transferHooks);
  }

  function setInitialUses(uint256 initialUses) external {
    ArtifactImpl.setInitialUses(initialUses);
  }
}
