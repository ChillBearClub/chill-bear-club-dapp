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
              {{ totalStakedCount }}
            </div>
          </div>
          <div class="flex flex-center col-4 column">
            <div class="text-center q-pb-md title text-weight-bolder">
              Token Count
            </div>
            <div class="text-center">
              {{ canStakeCount }}
            </div>
          </div>
          <q-space />
          <div class="flex flex-center col-4 column">
            <div class="text-center q-pb-md title text-weight-bolder">
              Wallet
            </div>
            <div class="text-center">
              {{ connectionStateArray[connectionState].wallet }}
            </div>
          </div>
          <div class="full-width text-center q-pt-lg" style="font-size: 16px">
            <em>Every 24 hours = 5 $Hunny per Chill Bear</em>
          </div>
        </div>
      </div>

      <div v-if="isLoading">
        <q-inner-loading style="position: relative; background: none" showing />
      </div>
      <div v-else class="flex flex-center column">
        <div
          class="text-center q-pt-sm bear-font text-weight-bolder"
          style="font-size: 2.5rem">
          {{ connectionStateArray[connectionState].status }}
        </div>
        <q-btn
          v-if="connectionState === 0 || connectionState === 2"
          class="connect-btn"
          size="large"
          @click="pressConnect"
          >{{ connectionStateArray[connectionState].text }}</q-btn>

        <div v-if="connectionState === 1 && canStakeCount > 0" class="flex row flex-center">
          <q-btn class="connect-btn" size="large" @click="doStake()">Stake All</q-btn>
        </div>
        <div v-if="totalStakedCount >= 1" class="flex row flex-center q-mt-md">
          <q-btn class="connect-btn" size="large" @click="doUnstake()">Unstake All</q-btn>
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
  opensea,
  network,
} from "src/scripts/config";
import {
  getCBCStaked, isStakingLive, tokensOfOwner, stakeByIds, unstakeAll, getBlockStaked, getStakedCount
} from "src/scripts/crypto";

const $q = useQuasar();
const store = useStore();
const connectionStateArray = ref([
  {
    text: "Connect",
    wallet: "Please connect",
    status: "Connect wallet to begin",
  },
  { text: "Mint", wallet: "", status: "" },
  { text: "Buy on OpenSea", wallet: "", status: "" },
]);
const connectionState = ref(0);
const invalidUser = ref(false);
const isLoading = ref(true);
const data = ref({});
const canStakeCount = ref(0);
const totalStakedCount = ref(0);

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

async function doStake() {
  if (!onValidNetwork()) {
    showNetworkError();
    return;
  }

  try {
    if (await isStakingLive()) {
      const webState = getState();
      const availableTokens = await tokensOfOwner(webState.address).catch((err) => {
        showError(getUsefulError(err))
      })

      if (!availableTokens) {
        throw new Error("Staking was not successful");
      }

      const func = await stakeByIds(availableTokens).catch((err) => {
        showError(getUsefulError(err))
      });

      if (!func) {
        throw new Error("Staking was not successful");
      }

      const tx = await func.wait().catch((err) =>  showError(getUsefulError(err)));

      if (!tx) {
        throw new Error("Staking was not successful");
      }

      showSuccess(`Successfully staked ${availableTokens.length} tokens! 👍`, 3000);
      await updateInterface();
    } else {
      throw new Error("Staking Is Not Live!");
    }
  } catch(e) {
    showError(getUsefulError(e))
  }
}

async function doUnstake() {
  if (!onValidNetwork()) {
    showNetworkError();
    return;
  }

  try {
    if (totalStakedCount.value >= 1) {
      const webState = getState();
      const stakeArray = await getCBCStaked(webState.address).catch((err) => {
        showError(getUsefulError(err))
      })

      if (!stakeArray) {
        throw new Error("Unstaking was not successful");
      }

      const func = await unstakeAll(stakeArray).catch((err) => {
        showError(getUsefulError(err))
      });

      if (!func) {
        throw new Error("Unstaking was not successful");
      }

      const tx = await func.wait().catch((err) => showError(getUsefulError(err)));

      if (!tx) {
        throw new Error("Unstaking was not successful");
      }

      showSuccess(`Successfully unstaked ${stakeArray.length} tokens! 👍`, 3000);
      await updateInterface();
    } else {
      throw new Error("No Tokens to Unstake!");
    }
  } catch(e) {
    showError(getUsefulError(e))
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

async function updateInterface() {
  const webState = getState();
  const availableTokens = await tokensOfOwner(webState.address).catch((err) => {
    showError(getUsefulError(err))
  })
  const stakeAmount = await getStakedCount(webState.address).catch((err) => {
    showError(getUsefulError(err))
  })

  if (!stakeAmount || !availableTokens) {
    canStakeCount.value = 0;
    totalStakedCount.value = 0;
    return;
  }

  const stakedAmountInt = Number.parseInt(stakeAmount.toString());
  canStakeCount.value = availableTokens.length - stakedAmountInt;
  totalStakedCount.value = stakedAmountInt;
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
