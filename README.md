# Chill Bear Club (chill-bear-club-dapp)

A minting DAPP for the Chill Bear Club

## .env file
```bash
VUE_APP_INFURA_KEY="your btoa key"
```
To set up your infura key:
1. Get your infura key
2. Open up the console in your browser
3. Input `btoa(MY_INFURA_KEY)`
4. Take that output and put it into the above `.env` field

## /src/scripts/config.json
```json
"contractAddress": "Chill Bears Address",
"contractAddressStake": "Staking Address",
"contractAddressHoney": "Honey Address",
"network": "your network",
```
> When you target mainnet, put homestead *not* mainnet into the network field

## Install the dependencies

```bash
npm install
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)

```bash
quasar dev
```

### Lint the files

```bash
npm run lint
```

### Format the files

```bash
npm run format
```

### Build the app for production

```bash
quasar build
```

### Customize the configuration

See [Configuring quasar.conf.js](https://quasar.dev/quasar-cli/quasar-conf-js).
