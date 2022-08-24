# Paypr Ethereum Contracts

## Setup

### Node

1.  Install `nvm` ([Node Version Manager](https://github.com/nvm-sh/nvm))
2.  `cd` to the project directory and execute the following:
    ```
    nvm install
    nvm use
    npm install
    ```

### IDE Setup

This project uses [EditorConfig](https://editorconfig.org/) for IDE configuration.

See `.editorconfig` for settings.

Many popular IDEs and editors support this out of the box or with a plugin.

## Development

### Prettier

This project uses [Prettier](https://prettier.io/), so please run it before checking in:

```
npm run pretty
```

See `.prettierrc` for settings.

Some IDEs and editors have plugins for running Prettier.

### Linting

This project uses [ESLint](https://eslint.org/). Check linting before checking in:

```
npm run lint
```

See `tslint.json` for settings.

Many IDEs and editors support TSLint.

## Testing

This project uses [Jest](https://jestjs.io/) for testing. Run tests before checking in.

```
npm run test
```

## Building

```
npm run build
```

## Contracts

To create a single file for a contract:
```
npx @poanet/solidity-flattener <sol-file>
```

## License Information

[GPLv3](https://www.gnu.org/licenses/gpl-3.0.html)

Paypr Ethereum Contracts may be used in commercial projects and applications
with the purchase of a commercial license. See https://paypr.money/ to contact us.

## Verification

Set up a `.secrets.json` file that looks similar to `example.secrets.json`:

After deploying your contract, you can verify it by running the following.

### Rinkeby
```
npx hardhat verify --network rinkeby CONTRACT_ADDRESS
```

For a diamond contract, you'll need to pass the arguments to the diamond contract, and pass the contract as well:

```
npx hardhat verify --network rinkeby \
  --constructor-args examples/payprConstructorArgs.js \
  CONTRACT_ADDRESS
```

### Mainnet
```
npx hardhat verify --network rinkeby CONTRACT_ADDRESS
```

```
npx hardhat verify --network mainnet \
  --constructor-args examples/payprConstructorArgs.js \
  CONTRACT_ADDRESS
```
