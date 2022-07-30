import { buildDiamondFacetCut, emptyDiamondInitFunction } from '../../../../src/contracts/diamonds';
import { EstimateTest } from '../../../helpers/EstimateHelper';
import { deployConsumableMintFacet } from '../../../helpers/facets/ConsumableFacetHelper';

export const consumableMintEstimateTests: EstimateTest[] = [
  [
    'ConsumableMintFacet',
    async () => ({
      diamondCuts: [buildDiamondFacetCut(await deployConsumableMintFacet())],
      initFunction: emptyDiamondInitFunction,
    }),
    122101,
  ],
];
