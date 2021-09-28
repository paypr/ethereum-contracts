# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.3.3](https://github.com/paypr/ethereum-contracts/compare/v0.3.2...v0.3.3) (2021-09-28)

### [0.3.2](https://github.com/paypr/ethereum-contracts/compare/v0.3.1...v0.3.2) (2021-09-28)

### [0.3.1](https://github.com/paypr/ethereum-contracts/compare/v0.3.0...v0.3.1) (2021-09-28)

## [0.3.0](https://github.com/paypr/ethereum-contracts/compare/v0.2.0...v0.3.0) (2021-09-28)

### ⚠ BREAKING CHANGES

- any code accessing old contracts will break
- Upgrades changed the contract base classes, which could cause storage changes

- [[#16](https://github.com/paypr/CHANGEME/issues/16)] remove pragma experimental ABIEncoderV2 ([5ee184a](https://github.com/paypr/ethereum-contracts/commit/5ee184a28042a72aec23d54d98d5f7dee30a50f6))
- [[#17](https://github.com/paypr/CHANGEME/issues/17)] upgrade to @openzeppelin/contracts-upgradeable:4.0.0 && convert to hardhat ([9b704d1](https://github.com/paypr/ethereum-contracts/commit/9b704d1de893c2e178d1cd50fcdc51efde0e905f))

## [0.2.0](https://github.com/paypr/ethereum-contracts/compare/v0.1.2...v0.2.0) (2020-10-22)

### ⚠ BREAKING CHANGES

- storage locations could have changed for any of these contracts, which means old contracts cannot be safely upgraded.

- [[#13](https://github.com/paypr/CHANGEME/issues/13)] extract logic into libraries and include base contracts to ensure order for upgrades ([0d08e6b](https://github.com/paypr/ethereum-contracts/commit/0d08e6b1fb21c4972435fdf7f6fbda6fa2b3d060))

### [0.1.2](https://github.com/paypr/ethereum-contracts/compare/v0.1.1...v0.1.2) (2020-10-09)

### Bug Fixes

- [[#9](https://github.com/paypr/CHANGEME/issues/9)] fixed exchange transfer token logic for consumables with asymmetrical exchange rates ([1d8e239](https://github.com/paypr/ethereum-contracts/commit/1d8e2397fb12b37346536969d68ba49130350576))

### [0.1.1](https://github.com/paypr/ethereum-contracts/compare/v0.1.0...v0.1.1) (2020-10-06)

### Bug Fixes

- [[#7](https://github.com/paypr/CHANGEME/issues/7)] fixed stupid logic error, and added a test to cover it ([d9d9839](https://github.com/paypr/ethereum-contracts/commit/d9d983947d3875b472bd87a28cc7ba4ee0938e06))

## [0.1.0](https://github.com/paypr/ethereum-contracts/compare/v0.0.3...v0.1.0) (2020-09-23)

### ⚠ BREAKING CHANGES

- updated the exchange and convertible consumable interfaces

### Features

- [[#5](https://github.com/paypr/CHANGEME/issues/5)] support asymmetrical exchange rates for Convertible Consumable ([1a71b18](https://github.com/paypr/ethereum-contracts/commit/1a71b18f753011bb538c539373ebbca5cb78887c))

### [0.0.3](https://github.com/paypr/ethereum-contracts/compare/v0.0.2...v0.0.3) (2020-09-21)

### [0.0.2](https://github.com/paypr/ethereum-contracts/compare/v0.0.1...v0.0.2) (2020-09-20)

### 0.0.1 (2020-09-20)

### Features

- [[#1](https://github.com/paypr/CHANGEME/issues/1)] initial contracts and tests ([de237e7](https://github.com/paypr/ethereum-contracts/commit/de237e7a5e829cfda3cc52c6298ef4fcea043844))
