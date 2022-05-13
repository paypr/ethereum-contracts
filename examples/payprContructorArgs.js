const { buildDiamondFacetCut, buildDiamondInitFunction } = require('../dist/src/contracts/diamonds');
const {
  CombinedAccessCheckFacet__factory,
  ConsumableExchangeConsumableHooks__factory,
  ConsumableFacet__factory,
  ConsumableMintFacet__factory,
  ContractInfoFacet__factory,
  DelegatingAccessFacet__factory,
  ContractInfoInit__factory,
  DelegatingAccessInit__factory,
  DiamondCutFacet__factory,
  DiamondLoupeFacet__factory,
  DiamondInit__factory,
  ERC165Facet__factory,
  TransferFacet__factory,
} = require('../dist/types/contracts');
const { buildDelegatingAccessAddDelegateInitFunction } = require('../dist/src/contracts/access');
const { buildContractInfoInitializeInitFunction } = require('../dist/src/contracts/contractInfo');
const { buildConsumableExchangeInitFunction } = require('../dist/src/contracts/consumables/exchange');
const { ConsumableExchangeFacet__factory, ConsumableExchangeInit__factory } = require('../types/contracts');

const accessControlFacet = new CombinedAccessCheckFacet__factory().attach('0x0000000000000000000000000000000000000000');
const consumableExchangeConsumableHooks = new ConsumableExchangeConsumableHooks__factory().attach(
  '0x0000000000000000000000000000000000000000',
);
const consumableExchangeFacet = new ConsumableExchangeFacet__factory().attach(
  '0x0000000000000000000000000000000000000000',
);
const consumableExchangeInit = new ConsumableExchangeInit__factory().attach(
  '0x0000000000000000000000000000000000000000',
);
const consumableFacet = new ConsumableFacet__factory().attach('0x0000000000000000000000000000000000000000');
const consumableMintFacet = new ConsumableMintFacet__factory().attach('0x0000000000000000000000000000000000000000');

const contractInfoFacet = new ContractInfoFacet__factory().attach('0x0000000000000000000000000000000000000000');
const contractInfoInit = new ContractInfoInit__factory().attach('0x0000000000000000000000000000000000000000');
const delegatingAccessFacet = new DelegatingAccessFacet__factory().attach('0x0000000000000000000000000000000000000000');
const delegatingAccessInit = new DelegatingAccessInit__factory().attach('0x0000000000000000000000000000000000000000');
const diamondCutFacet = new DiamondCutFacet__factory().attach('0x0000000000000000000000000000000000000000');
const diamondLoupeFacet = new DiamondLoupeFacet__factory().attach('0x0000000000000000000000000000000000000000');
const diamondInit = new DiamondInit__factory().attach('0x0000000000000000000000000000000000000000');
const erc165Facet = new ERC165Facet__factory().attach('0x0000000000000000000000000000000000000000');
const transferFacet = new TransferFacet__factory().attach('0x0000000000000000000000000000000000000000');

module.exports = [
  {
    diamondCuts: [
      buildDiamondFacetCut(erc165Facet),
      buildDiamondFacetCut(diamondCutFacet),
      buildDiamondFacetCut(diamondLoupeFacet),
      buildDiamondFacetCut(contractInfoFacet),
      buildDiamondFacetCut(accessControlFacet),
      buildDiamondFacetCut(delegatingAccessFacet),
      buildDiamondFacetCut(accessControlFacet),
      buildDiamondFacetCut(consumableFacet),
      buildDiamondFacetCut(consumableMintFacet),
      buildDiamondFacetCut(consumableExchangeFacet),
      buildDiamondFacetCut(transferFacet),
    ],
    initFunction: buildDiamondInitFunction(diamondInit, [
      buildDelegatingAccessAddDelegateInitFunction(delegatingAccessInit, accessControlDelegateAddress),
      buildContractInfoInitializeInitFunction(contractInfoInit, {
        name,
        symbol: 'xℙ',
        uri: 'https://paypr.money/',
        description: 'Paypr exchange token proxy',
      }),
      buildConsumableExchangeInitFunction(consumableExchangeInit, {
        exchangeConsumableHooks: consumableExchangeConsumableHooks,
      }),
    ]),
  },
];
