import {ethers} from 'ethers';
import {
  contractAddress,
  network,
  gasLimit
} from './config.json';
import abi from './abi.json'
import {keys} from "./keys";
import { getState } from "src/scripts/web3modal";

const ogWhitelist = {
  // "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": "0xe486d8750a6824572d312cc9f1b4eeb05983d2d6eff4ff7a43e9d593ed3b6e5f1e451ccfad03efcf7e53c671bdee32399860ad1314ef2b6ccf6e72936b46f0021b"
}

const mintWhitelist = {
  "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266": "0x0cb5f2707779110c28efda5e2851758a6efaf578ac497b5ea346a622523bd3781d2e53642fada98a44b46ed9eb2a47a296751737df7deea330d3cb05836f00721b"
}

const keysOgWhitelist = Object.keys(ogWhitelist);
const keysMintWhitelist = Object.keys(mintWhitelist);

/*
  Whitelist stuff is handled here. Swap to use a database instead of json.
 */
export function inWhitelist(address) {
  if (!address) {
    return [false, false];
  }

  return [keysOgWhitelist.includes(address), keysMintWhitelist.includes(address)];
}

// eslint-disable-next-line no-unused-vars
export function getContract () {
  switch (network) {
    case "rinkeby":
    case "homestead":
      return getContractInfura()[0];
    default:
      return getContractJson();
  }
}

function getContractJson() {
  const provider = new ethers.providers.JsonRpcProvider();
  return new ethers.Contract(contractAddress, abi, provider);
}

function getContractInfura () {
  const provider = new ethers.providers.InfuraProvider(network, keys.INFURA_KEY);
  return [
    new ethers.Contract(contractAddress, abi, provider),
    provider
  ]
}

export const getMintCount = async () => {
  const contract = getContract();

  return await contract.totalSupply()
}

export const getSalesStatus = async () => {
  const contract = getContract();

  return await contract.getSalesStatus()
}

export async function getMintingInfo() {
  const contract = getContract();

  return await contract.getMintingInfo()
}

export function getSignature(address, state) {
  if (!address) {
    return undefined;
  }

  return state[0] ? ogWhitelist[address] : state[1] ? mintWhitelist[address] : undefined;
}

export async function doOgMint(amount, cost, digits) {
  if (amount < 0 || amount > 2) {
    throw new Error('Invalid amount provided!');
  }

  // get signer
  const provider = getState().provider;

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const contract = getContract().connect(signer);

  const wei = ethers.utils.parseEther((cost * amount).toFixed(digits).toString());
  const tx = {
    value: wei,
    nonce: await provider.getTransactionCount(address) || undefined,
    gasLimit: gasLimit[network] * amount
  };

  const [og, _] = inWhitelist(address);
  if (!og) {
    throw new Error('You are not in the OG whitelist!');
  }

  return contract[`ogMint${amount}`](getSignature(address, [true, false]), tx);
}

export async function doPreSaleMint(amount, cost, digits) {
  if (amount !== 1) {
    throw new Error('Invalid amount provided!');
  }

  // get signer
  const provider = getState().provider;

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const contract = getContract().connect(signer);

  const wei = ethers.utils.parseEther((cost * amount).toFixed(digits).toString());
  const tx = {
    value: wei,
    nonce: await provider.getTransactionCount(address) || undefined,
    gasLimit: gasLimit[network] * amount
  };

  const [_, presale] = inWhitelist(address);
  if (!presale) {
    throw new Error('You are not in the presale whitelist!');
  }

  return contract.preMint(getSignature(address, [false, true]), tx);
}

export async function doMint(amount, cost, digits) {
  if (amount !== 1) {
    throw new Error('Invalid amount provided!');
  }

  // get signer
  const provider = getState().provider;

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const contract = getContract().connect(signer);

  const wei = ethers.utils.parseEther((cost * amount).toFixed(digits).toString());
  const tx = {
    value: wei,
    nonce: await provider.getTransactionCount(address) || undefined,
    gasLimit: gasLimit[network] * amount
  };

  return contract.mint(tx);
}
