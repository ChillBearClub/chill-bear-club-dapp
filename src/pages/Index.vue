<template>
  <q-page class="flex">
    <div
      class="flex column full-width flex-center items-center q-pt-md q-pb-xl"
    >
      <div class="logo-holder">
        <q-img alt="Logo" src="~assets/logo.png" />
      </div>

      <div class="avatar-holder">
        <q-img class="circle" alt="Avatar" src="~assets/avatar.png" />
      </div>

      <div class="info-holder flex flex-center">
        <div :class="informationClasses">
          <div class="flex flex-center col-4 column">
            <div class="text-center q-pb-md title text-weight-bolder">
              Staked Count
            </div>
            <div class="text-center">
              {{ StakedTokens }}
            </div>
          </div>
          <div class="flex flex-center col-4 column">
            <div class="text-center q-pb-md title text-weight-bolder"></div>
            <div class="text-center">{{ mintPrice }} ETH</div>
          </div>
          <div class="flex flex-center col-4 column">
            <div class="text-center q-pb-md title text-weight-bolder">
              Wallet
            </div>
            <div class="text-center">
              {{ connectionStateArray[connectionState].wallet }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="isLoading">
        <q-inner-loading style="position: relative; background: none" showing />
      </div>
      <div v-else class="flex flex-center column">
        <div
          class="text-center q-pt-sm bear-font text-weight-bolder"
          style="font-size: 2.5rem"
        >
          {{ connectionStateArray[connectionState].status }}
        </div>
        <q-btn
          v-if="connectionState === 0 || connectionState === 2"
          class="connect-btn"
          size="large"
          @click="pressConnect"
          >{{ connectionStateArray[connectionState].text }}</q-btn
        >

        <div v-if="connectionState === 1" class="flex row flex-center">
          <q-btn class="connect-btn" size="large" @click="stakeAll()">
            Stake All</q-btn
          >
        </div>
        <div v-if="StakedTokens >= 1" class="flex row flex-center">
          <q-btn class="connect-btn" size="large" @click="unStakeAll()">
            Unstake All</q-btn
          >
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useQuasar } from "quasar";
import { computed, onMounted, reactive, ref } from "vue";
import { useStore } from "vuex";
import { getState, signIn } from "src/scripts/web3modal";
import { getUsefulError, trimAddress } from "src/scripts/util";
import {
  contractAddressCBC,
  contractAddressStake,
  contractAddressHoney,
  opensea,
  network,
} from "src/scripts/config";
import {
  getContract,
  getStaked,
  getStakedCBC,
  getStakeable,
  getContractCBC,
  getContractHoney,
} from "src/scripts/crypto";
import { ethers } from "ethers";

const stakingLive = ref(false);
const $q = useQuasar();
const store = useStore();
const connectionStateArray = ref([
  {
    text: "Connect",
    wallet: "Please connect",
    status: "Connect wallet to begin",
  },
  { text: "Mint", wallet: "", status: "Current status: -" },
  { text: "Buy on OpenSea", wallet: "", status: "Current status: Sold out!" },
]);
const stakeableCount = ref(0);
const StakedTokens = ref(0);
const connectionState = ref(0);
const invalidUser = ref(false);
const isLoading = ref(true);
const data = ref({});

const informationClasses = computed(() => {
  const isMobile = $q.screen.lt.md;
  return `inner flex items-start ${
    isMobile ? "column flex-center" : "row flex-start"
  }`;
});

onMounted(() => {
  store.subscribe(async (mutation, state) => updateState());
  updateState();

  setTimeout(() => {
    isLoading.value = false;
  }, 500);
});

async function pressConnect() {
  switch (connectionState.value) {
    case 0:
      const state = getState();

      if (state.address) {
        showSuccess("Wallet connected to Chill Bear Club! 👍", 3000);
      } else {
        await signIn().catch((err) => showError(getUsefulError(err)));
      }
      break;
    case 2:
      window.open(
        opensea[network]
          .replace("ID", contractAddressHoney)
          .replace("TOKEN", ""),
        "_blank"
      );
      break;
  }
}

function onValidNetwork() {
  const state = getState();
  let n = state.networkName;

  if (n === "unknown") {
    n = "localhost";
  }

  return n === network;
}

function showNetworkError() {
  const state = getState();

  let n = network;
  if (n === "homestead") {
    n = "mainnet";
  }
  if (n === "unknown") {
    n = "localhost";
  }
  $q.notify({
    message: `Please connect to ${n} instead of ${state.networkName}!`,
    color: "red",
    position: "bottom",
    timeout: 3000,
  });
}

async function stakeAll() {
  if (stakingLive.value === true) {
    const cbcOwned = await getStakedCBC();
    console.log(cbcOwned.value);
    const contract = getContract();

    await contract.stakeByIds(cbcOwned);

    showSuccess(` 👍`, 3000);
    await updateInterface();
  } else {
    //  throw new Error("Staking Is Not Live!");
  }
}

async function unStakeAll(amount) {
  if (StakedTokens.value >= 1) {
    const contract = getContract();

    await contract.unstakeAll();

    showSuccess(`Successfully minted ${amount} tokens! 👍`, 3000);
    await updateInterface();
  } else {
    throw new Error("No Tokens to Unstake!");
  }
}

async function updateState() {
  const webState = getState();
  connectionState.value = webState.address ? 1 : 0;
  invalidUser.value = true;
  if (webState.address) {
    connectionStateArray.value[1].wallet = trimAddress(webState.address);
    connectionStateArray.value[2].wallet = trimAddress(webState.address);

    $q.notify({
      message: "Wallet connected to Chill Bear Club! 👍",
      color: "green",
      position: "bottom-right",
      actions: [
        {
          label: "Ok",
          color: "white",
          handler: () => {
            /* ... */
          },
        },
      ],
      timeout: 3000,
    });

    // check statuses
    await updateInterface();
  }
}

function showSuccess(msg, timeout) {
  $q.notify({
    message: msg,
    color: "green",
    position: "bottom-right",
    actions: [
      {
        label: "Ok",
        color: "white",
        handler: () => {
          /* ... */
        },
      },
    ],
    timeout,
  });
}

function showError(err) {
  $q.notify({
    message: err,
    color: "red",
    position: "bottom-right",
    actions: [
      {
        label: "Ok",
        color: "white",
        handler: () => {
          /* ... */
        },
      },
    ],
    timeout: 30 * 1000,
  });
}

async function isStakingLive() {
  const contract = getContract();

  return await contract.stakingLive();
}

async function updateInterface() {
  const webState = getState();
  stakeableCount.value = await getStakeable(webState.address).catch((err) =>
    showError(getUsefulError(err))
  );

  const stakecount = await getStaked(webState.address).catch((err) =>
    showError(getUsefulError(err))
  );
  StakedTokens.value = Number.parseInt(stakecount.toString());
  stakingLive.value = await isStakingLive();
}
</script>

<style lang="scss" scoped>
.logo-holder {
  max-width: 600px;
  margin: 0 auto;
  width: 100%;
  padding-left: 24px;
  padding-right: 24px;
}

.avatar-holder {
  max-width: 250px;
  margin: 0 auto;
  width: 100%;
  padding-left: 24px;
  padding-right: 24px;
}

.info-holder {
  max-width: 800px;
  margin: 0 auto;
  margin-top: 16px;
  width: 100%;
  padding: 24px;

  .inner {
    width: 100%;
    padding: 24px;
    background-color: white;
    border-radius: 10px;
  }
}

.connect-btn {
  background-color: #bcbcf5;
  color: white;
  border-radius: 10px;
}
</style>
