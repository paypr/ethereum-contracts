# Paypr Ethereum Contracts

[![Paypr](https://circleci.com/gh/paypr/ethereum-contracts.svg?style=shield)](https://circleci.com/gh/paypr/ethereum-contracts)

## Setup

### Node

1.  Install `nvm` ([Node Version Manager](https://github.com/creationix/nvm))
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

This project uses [TSLint](https://palantir.github.io/tslint/). Check linting before checking in:

```
npm run lint
```

See `tslint.json` for settings.

Many IDEs and editors support TSLint.

## Testing

This project uses [Jest](https://jestjs.io/) for testing. Run tests before checking in.

### Unit Tests

```
npm test
```

### Integration Tests

```
npm run test:integration
```

## Building

```
npm run build
```

## Contracts

### Setting up Rinkby

This isn't necessary for local deployment, but eventually you'll want to
test on a semi-real test network.

1. Create an account at [Infura](https://infura.io)
2. Create a new mnemonic with the following command:

   ```shell script
   npx mnemonics
   ```

3. Create a secrets file at `secrets.json` with the following structure:

   ```json
   {
     "mnemonic": "some great words ...",
     "mnemonicProd": "some better words ...",
     "projectId": "12345abcde",
     "projectSecret": "abcde12345"
   }
   ```

### Build and deploy

```shell script
npx oz create
```

## License Information

[GPLv3](https://www.gnu.org/licenses/gpl-3.0.html)

Paypr Ethereum Contracts may be used in commercial projects and applications
with the purchase of a commercial license. See https://paypr.money/ to contact us.
