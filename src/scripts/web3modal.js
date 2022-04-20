import Web3Modal from "web3modal";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from "ethers";
import { network, infura } from "./config.json";
import { keys } from "src/scripts/keys";
import { getContract } from "src/scripts/crypto";
const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: `${keys.INFURA_KEY}`,
    },
  },
};

const web3Modal = new Web3Modal({
  network: network === "homestead" ? "mainnet" : network,
  cacheProvider: true,
  providerOptions,
  theme: "light",
});

let state = {};
let setProviderEvents = false;

// events
let onReset;
let onUpdateState;

function subscribeProvider(provider) {
  if (!provider.on || setProviderEvents) {
    return;
  }

  setProviderEvents = true;

  provider.on("close", () => {
    // console.log('close')
    // reset
    onReset();
  });

  provider.on("accountsChanged", (accounts) => {
    // console.log('accountsChanged')
    web3Modal.clearCachedProvider();
    state.address = accounts[0];
    onUpdateState();

    window.location.reload();
  });

  provider.on("chainChanged", (chainId) => {
    window.location.reload();
  });

  provider.on("networkChanged", (networkId) => {
    window.location.reload();
  });
}

export async function signIn() {
  if (setProviderEvents) {
    return;
  }

  const instance = await web3Modal.connect();

  await subscribeProvider(instance);
  await instance.enable();

  const provider = new ethers.providers.Web3Provider(instance);
  await provider.ready;

  const accounts = await provider.listAccounts();
  const address = accounts[0];
  const { chainId, name } = await provider.getNetwork();
  state = {
    provider,
    instance,
    connected: true,
    address,
    chainId,
    networkName: name,
  };

  if (onUpdateState) {
    onUpdateState();
  }
}

export function setOnReset(func) {
  onReset = func;
}

export function setOnUpdateState(func) {
  onUpdateState = func;
  onUpdateState();
}

export function hasCachedProvider() {
  return web3Modal.cachedProvider;
}

export function clearProvider() {
  web3Modal.clearCachedProvider();
}

export function getState() {
  return state;
}

export function setState(val) {
  state = val;
}
