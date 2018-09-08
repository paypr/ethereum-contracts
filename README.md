# CHANGEME

## Setup

### Node

1.  Install `nvm` (Node Version Manager)
2.  `cd` to the project directory and execute the following:
    ```
    nvm install
    nvm use
    npm install
    ```

### IDE Setup

This project uses [EditorConfig](https://editorconfig.org/) for IDE configuration. Many popular IDEs and editors
support this out of the box or with a plugin.

## Development

### Prettier

This project uses [Prettier](https://prettier.io/), so please run it before checking in:

```
npm run pretty
```

Some IDEs and editors have plugins for running Prettier.

### Linting

This project uses [TSLint](https://palantir.github.io/tslint/). Check linting before checking in:

```
npm run lint
```

Many IDEs and editors support TSLint

## Testing

This project uses [Jasmine](https://jasmine.github.io/) for testing. Run tests before checking in.

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
