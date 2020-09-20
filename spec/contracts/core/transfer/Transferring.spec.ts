import {
  createExchangingTransferring,
  createTransferring,
  shouldTransferItem,
  shouldTransferToken,
} from '../../../helpers/TransferringHelper';

describe('transferToken', () => {
  shouldTransferToken(createTransferring);
});

describe('transferTokenWithExchange', () => {
  shouldTransferToken(createExchangingTransferring, { withExchange: true });
});

describe('transferItem', () => {
  shouldTransferItem(createTransferring);
});
