import { ethers } from "ethers";
import { contractAddress, network, gasLimit } from "./config.json";
import abi from "./abi.json";
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

/*
  Whitelist stuff is handled here. Swap to use a database instead of json.
 */
export async function inWhitelist(address) {
  if (!address) {
    return [false, false];
  }

  return await new Promise((resolve, reject) => {
    const OGRef = ref(db, "OGlist/" + address + "/");
    const WLRef = ref(db, "Whitelist/" + address + "/");

    let ranOg = false;
    let ranWl = false;

    let ogSig;
    let wlSig;

    onValue(OGRef, (snapshot) => {
      ogSig = snapshot.val();
      ranOg = true;
      validateOutput();
    });

    onValue(WLRef, (snapshot) => {
      wlSig = snapshot.val();
      ranWl = true;
      validateOutput();
    });

    function validateOutput() {
      if (ranOg && ranWl) {
        resolve([ogSig !== null, wlSig !== null]);
      }
    }
  });
}

// eslint-disable-next-line no-unused-vars
export function getContract() {
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

function getContractInfura() {
  const provider = new ethers.providers.InfuraProvider(
    network,
    keys.INFURA_KEY
  );
  return [new ethers.Contract(contractAddress, abi, provider), provider];
}

export const getMintCount = async () => {
  const contract = getContract();

  return await contract.totalSupply();
};

export const getSalesStatus = async () => {
  const contract = getContract();

  return await contract.getSalesStatus();
};

export async function getMintingInfo() {
  const contract = getContract();

  return await contract.getMintingInfo();
}

export async function getSignature(address, state) {
  if (!address) {
    return undefined;
  }

  return await new Promise((resolve, reject) => {
    const OGRef = ref(db, "OGlist/" + address + "/");
    const WLRef = ref(db, "Whitelist/" + address + "/");

    let ranOg = false;
    let ranWl = false;

    let ogSig;
    let wlSig;

    onValue(OGRef, (snapshot) => {
      ogSig = snapshot.val();
      ranOg = true;
      validateOutput();
    });

    onValue(WLRef, (snapshot) => {
      wlSig = snapshot.val();
      ranWl = true;
      validateOutput();
    });

    function validateOutput() {
      if (ranOg && ranWl) {
        resolve(state[0] ? ogSig : state[1] ? wlSig : undefined);
      }
    }
  });
}

export async function doOgMint(amount, cost, digits) {
  if (amount < 0 || amount > 2) {
    throw new Error("Invalid amount provided!");
  }

  // get signer
  const provider = getState().provider;

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const contract = getContract().connect(signer);

  const wei = ethers.utils.parseEther(
    (cost * amount).toFixed(digits).toString()
  );

  const tx = {
    value: wei,
    nonce: (await provider.getTransactionCount(address)) || undefined,
    gasLimit: gasLimit[network] * amount,
  };

  const [og, _] = await inWhitelist(address);
  if (!og) {
    throw new Error("You are not in the OG whitelist!");
  }

  return contract.ogMint(await getSignature(address, [true, false]), amount, tx)

  // return contract[`ogMint${amount}`](await getSignature(address, [true, false]), tx);
}

export async function doPreSaleMint(amount, cost, digits) {
  if (amount !== 1) {
    throw new Error("Invalid amount provided!");
  }

  // get signer
  const provider = getState().provider;

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const contract = getContract().connect(signer);

  const wei = ethers.utils.parseEther(
    (cost * amount).toFixed(digits).toString()
  );
  const tx = {
    value: wei,
    nonce: (await provider.getTransactionCount(address)) || undefined,
    gasLimit: gasLimit[network] * amount,
  };

  const [_, presale] = await inWhitelist(address);
  if (!presale) {
    throw new Error("You are not in the presale whitelist!");
  }

  return contract.preMint(await getSignature(address, [false, true]), tx);
}

export async function doMint(amount, cost, digits) {
  if (amount !== 1) {
    throw new Error("Invalid amount provided!");
  }

  // get signer
  const provider = getState().provider;

  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  const contract = getContract().connect(signer);

  const wei = ethers.utils.parseEther(
    (cost * amount).toFixed(digits).toString()
  );
  const tx = {
    value: wei,
    nonce: (await provider.getTransactionCount(address)) || undefined,
    gasLimit: gasLimit[network] * amount,
  };

  return contract.mint(tx);
}
