const HDWalletProvider = require('@truffle/hdwallet-provider');
const {projectId, mnemonic, mnemonicProd} = require('./secrets');

module.exports = {
  networks: {
    development: {
      protocol: 'http',
      host: 'localhost',
      port: 8545,
      gas: 5000000,
      gasPrice: 5e9,
      networkId: '*',
    },
    ganache: {
      protocol: 'http',
      host: 'localhost',
      port: 7545,
      gas: 5000000,
      gasPrice: 5e9,
      networkId: '*',
    },
    rinkeby: {
      provider: () => new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/v3/${projectId}`),
      networkId: 4,
      gasPrice: 10e9,
    },
    mainnet: {
      provider: () => new HDWalletProvider(mnemonicProd || mnemonic, `https://mainnet.infura.io/v3/${projectId}`),
      networkId: 4,
      gasPrice: 1e9,
    },
  },
};
