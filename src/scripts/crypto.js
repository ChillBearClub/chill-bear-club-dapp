import { ethers } from "ethers";
import {
  contractAddress,
  contractAddressStake,
  contractAddressHoney,
  network,
  gasLimit,
} from "./config.json";
import abi from "./abi.json";
import abiHoney from "./abi-honey.json";
import abiStake from "./abi-stake.json";
import { keys } from "./keys";
import { getState } from "src/scripts/web3modal";
import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDka0wKFRhlAHRbgzAoFjW18Sa4ZW2y5rY",
  authDomain: "chill-bears-dapp.firebaseapp.com",
  databaseURL: "https://chill-bears-dapp-default-rtdb.firebaseio.com",
  projectId: "chill-bears-dapp",
  storageBucket: "chill-bears-dapp.appspot.com",
  messagingSenderId: "287457261991",
  appId: "1:287457261991:web:2a2464867372ff9189de82",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase();

// eslint-disable-next-line no-unused-vars
export function getContract(address, abi) {
  switch (network) {
    case "rinkeby":
    case "homestead":
      return getContractInfura(address, abi)[0];
    default:
      return getContractJson(address, abi);
  }
}

function getContractJson(address, abi) {
  const provider = new ethers.providers.JsonRpcProvider();
  return new ethers.Contract(address, abi, provider);
}

function getContractInfura(address, abi) {
  const provider = new ethers.providers.AlchemyProvider(
    network,
    keys.ALCHEMY_KEY
  );

  return [new ethers.Contract(address, abi, provider), provider];
}

// Stake contract

export async function getCBCStaked(address) {
  const contractCBC = getContract(contractAddressStake, abiStake);

  return await contractCBC.getCBCStaked(address);
}

export async function getStakedCount(address) {
  const contractCBC = getContract(contractAddressStake, abiStake);

  return await contractCBC.getStakedCount(address);
}

export async function isStakingLive() {
  const contractCBC = getContract(contractAddressStake, abiStake);

  return await contractCBC.stakingLive();
}

export async function stakeByIds(tokens) {
  const provider = getState().provider;
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const contractCBC = getContract(contractAddressStake, abiStake).connect(
    signer
  );
  const tx = {
    nonce: (await provider.getTransactionCount(address)) || undefined,
    // gasLimit: gasLimit[network] + gasLimit["perToken"] * tokens.length + "",
  };

  return await contractCBC.stakeByIds(tokens, tx);
}

export async function unstakeAll(tokens) {
  const provider = getState().provider;
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const contractCBC = getContract(contractAddressStake, abiStake).connect(
    signer
  );
  const tx = {
    nonce: (await provider.getTransactionCount(address)) || undefined,
    // gasLimit: gasLimit[network] * tokens.length,
  };

  return await contractCBC.unstakeByIds(tokens, tx);
}

export async function getBlockStaked(tokenId) {
  const contractCBC = getContract(contractAddressStake, abiStake);

  return await contractCBC.getBlockStaked(tokenId);
}

export async function getStakedTokenIds(address) {
  const contractCBC = getContract(contractAddressStake, abiStake);

  return await contractCBC.getCBCStaked(address);
}

export async function getStakedLength(tokenId) {
  const provider = new ethers.providers.AlchemyProvider(
    network,
    keys.ALCHEMY_KEY
  );
  const contractCBC = getContract(contractAddressStake, abiStake);

  return -(
    (await contractCBC.getLockedUntil(tokenId)) -
    2592000 -
    (await provider.getBlock(await provider.getBlockNumber())).timestamp
  );
}

// export async function isTimeLocked(tokenId) {
//   const contractCBC = getContract(contractAddressStake, abiStake);

//   return await contractCBC.
// }

// Chill contract

export async function tokensOfOwner(address) {
  const contract = getContract(contractAddress, abi);

  return await contract.tokensOfOwner(address);
}

export async function isApprovedForStaking(address) {
  const contract = getContract(contractAddress, abi);

  return await contract.isApprovedForAll(address, contractAddressStake);
}

export async function approveForStaking() {
  const provider = getState().provider;
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const contract = getContract(contractAddress, abi).connect(signer);
  const tx = {
    nonce: (await provider.getTransactionCount(address)) || undefined,
    // gasLimit: gasLimit["approving"] + "",
  };

  return await contract.setApprovalForAll(contractAddressStake, true, tx);
}

// export async function getSignature(address, state) {
//   if (!address) {
//     return undefined;
//   }
//
//   return await new Promise((resolve, reject) => {
//     const OGRef = ref(db, "OGlist/" + address + "/");
//     const WLRef = ref(db, "Whitelist/" + address + "/");
//
//     let ranOg = false;
//     let ranWl = false;
//
//     let ogSig;
//     let wlSig;
//
//     onValue(OGRef, (snapshot) => {
//       ogSig = snapshot.val();
//       ranOg = true;
//       validateOutput();
//     });
//
//     onValue(WLRef, (snapshot) => {
//       wlSig = snapshot.val();
//       ranWl = true;
//       validateOutput();
//     });
//
//     function validateOutput() {
//       if (ranOg && ranWl) {
//         resolve(state[0] ? ogSig : state[1] ? wlSig : undefined);
//       }
//     }
//   });
// }
