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
            <div class="text-center" style="font-size: 20px">
              {{ totalStakedCount }}
            </div>
          </div>
          <div class="flex flex-center col-4 column">
            <div class="text-center q-pb-md title text-weight-bolder">
              Unstaked Count
            </div>
            <div class="text-center" style="font-size: 20px">
              {{ canStakeCount }}
            </div>
          </div>
          <q-space />
          <div class="flex flex-center col-4 column">
            <div class="text-center q-pb-md title text-weight-bolder">
              Wallet
            </div>
            <div class="text-center" style="font-size: 20px">
              {{ connectionStateArray[connectionState].wallet }}
            </div>
          </div>
          <div class="full-width text-center q-pt-lg">
            <div class="text-center q-pb-md title text-weight-bolder">
              Unclaimed HUNNY
            </div>
            <div class="text-center" style="font-size: 20px">
              {{ hunnyOwed }}
            </div>
          </div>
          <div class="full-width text-center q-pt-lg" style="font-size: 16px">
            <em>5 $HUNNY/day, per staked bear</em>
            <br />
            <br />
            <em style="color: red"
              ><b
                >Warning: Staked bears are Time-locked for 30 days in the
                contract.</b
              ></em
            >
            <br />
            <em
              >You will not be able to unstake until the time-lock expires.</em
            >
            <br />
            <em
              ><b
                >Please read and understand our staking & tokenomics guide
                before continuing
                <a
                  target="_blank"
                  href="https://medium.com/@chillbear440/chill-bear-club-tokenomics-staking-e95de07e54ba"
                  >here</a
                >
                .</b
              ></em
            >
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

        <div
          v-if="connectionState === 1 && !approved"
          class="flex row flex-center"
        >
          <q-btn class="connect-btn" size="large" @click="doApprove()"
            >Approve For Staking</q-btn
          >
        </div>

        <div
          v-if="connectionState === 1 && canStakeCount > 0 && approved"
          class="flex row flex-center"
        >
          <q-btn class="connect-btn" size="large" @click="doStake()"
            >Stake All</q-btn
          >
        </div>
        <br />
        <div
          v-if="connectionState === 1 && canStakeCount > 0 && approved"
          class="flex row flex-center"
        >
          <q-btn
            class="connect-btn"
            size="large"
            @click="customStakePopup = true"
            >Stake By ID</q-btn
          >
        </div>
        <div
          v-if="connectionState === 1 && canStakeCount == 0 && approved"
          class="flex row flex-center"
        >
          <q-btn class="connect-btn" size="large">No Bears to Stake</q-btn>
        </div>
        <q-dialog v-model="customStakePopup">
          <q-card>
            <q-card-section class="row items-center q-pb-none">
              <div class="text-h6">Staking By ID</div>
              <q-space />
              <q-btn icon="close" flat round dense v-close-popup />
            </q-card-section>

            <q-card-section style="max-height: 50vh" class="scroll">
              <q-list
                bordered
                padding
                id="staking-elements"
                :key="doCustomStakingReRender"
              >
                <q-item-label header>Select To Stake</q-item-label>
                <div
                  v-for="status in customStakingStatus"
                  v-bind:key="status.token"
                >
                  <q-item tag="label" v-ripple>
                    <q-avatar>
                      <img :src="getBearImage(status.token)" />
                    </q-avatar>

                    <q-item-section style="padding-left: 10px">
                      <q-item-label
                        ><a
                          :href="
                            'https://opensea.io/assets/0xc7b76846de3db54db45c8b5debcabff4b0834f78/' +
                            status.token
                          "
                          target="_blank"
                          >Chill Bear #{{ status.token }}</a
                        ></q-item-label
                      >
                      <q-item-label caption>
                        Select to stake this bear.
                      </q-item-label>
                    </q-item-section>
                    <q-item-section side top>
                      <q-checkbox
                        v-model="status.checked"
                        @click="doCustomStakingReRender += 1"
                      />
                    </q-item-section>
                  </q-item>
                </div>
              </q-list>
            </q-card-section>
            <div
              v-if="connectionState === 1 && canStakeCount > 0 && approved"
              class="flex row flex-center"
            >
              <q-btn
                class="connect-btn"
                size="large"
                @click="doCustomStake()"
                v-close-popup
                >Stake</q-btn
              >
            </div>
            <br />
          </q-card>
        </q-dialog>
        <div v-if="totalStakedCount >= 1" class="flex row flex-center q-mt-md">
          <q-btn class="connect-btn" size="large" @click="doUnstake()"
            >Unstake All
            <br />
            (Time Locked)
            <q-tooltip>Your bears are currently locked.</q-tooltip>
          </q-btn>
        </div>
        <div v-if="totalStakedCount >= 1" class="flex row flex-center q-mt-md">
          <q-btn class="connect-btn" size="large" disabled @click="doUnstake()"
            >Unstake By ID
            <br />
            (Time Locked)
            <q-tooltip>Your bears are currently locked.</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { QItem, useQuasar } from "quasar";
import {
  computed,
  onMounted,
  reactive,
  ref,
  defineComponent,
  defineCustomElement,
} from "vue";
import { useStore } from "vuex";
import { getState, signIn } from "src/scripts/web3modal";
import { getUsefulError, trimAddress } from "src/scripts/util";
import { opensea, network } from "src/scripts/config";
import {
  getCBCStaked,
  isStakingLive,
  tokensOfOwner,
  stakeByIds,
  unstakeAll,
  getBlockStaked,
  getStakedCount,
  isApprovedForStaking,
  approveForStaking,
  getStakedTokenIds,
  getStakedLength,
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
const canStakeCount = ref("-");
const totalStakedCount = ref("-");
const approved = ref(false);
const customStakePopup = ref(false);
const doCustomStakingReRender = ref(0);
const hunnyOwed = ref("0");

let customStakingStatus = [];

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

async function isApproved() {
  const state = getState();

  return await isApprovedForStaking(state.address);
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

async function doApprove() {
  if (!onValidNetwork()) {
    showNetworkError();
    return;
  }

  try {
    const webState = getState();

    const func = await approveForStaking().catch((err) => {
      showError(getUsefulError(err));
    });

    if (!func) {
      throw new Error("Approval was not successful!");
    }

    const tx = await func.wait().catch((err) => showError(getUsefulError(err)));

    if (!tx) {
      throw new Error("Approval was not successful!");
    }

    showSuccess(`Successfully approved contract for staking! 👍`, 3000);

    await updateInterface();
  } catch (e) {
    showError(getUsefulError(e));
  }
}

async function doStake(tokensToStake = undefined) {
  if (!onValidNetwork()) {
    showNetworkError();
    return;
  }

  try {
    if (await isStakingLive()) {
      const webState = getState();
      const availableTokens = await tokensOfOwner(webState.address).catch(
        (err) => {
          showError(getUsefulError(err));
        }
      );
      const approved = await isApproved().catch((err) => {
        showError(getUsefulError(err));
      });

      if (!approved) {
        throw new Error("You must approve for staking first!");
      }

      if (!availableTokens) {
        throw new Error("Staking was not successful");
      }

      let func;
      if (!tokensToStake) {
        func = await stakeByIds(availableTokens).catch((err) => {
          showError(getUsefulError(err));
        });
      } else {
        func = await stakeByIds(tokensToStake).catch((err) => {
          showError(getUsefulError(err));
        });
      }

      if (!func) {
        throw new Error("Staking was not successful");
      }

      const tx = await func
        .wait()
        .catch((err) => showError(getUsefulError(err)));

      if (!tx) {
        throw new Error("Staking was not successful");
      }

      if (!tokensToStake) {
        showSuccess(
          `Successfully staked ${availableTokens.length} tokens! 👍`,
          3000
        );
      } else {
        showSuccess(
          `Successfully staked ${tokensToStake.length} tokens! 👍`,
          3000
        );
      }
      await updateInterface();
    } else {
      throw new Error("Staking Is Not Live!");
    }
  } catch (e) {
    showError(getUsefulError(e));
  }
}

async function doCustomStake() {
  const customStakedTokens = [];
  customStakingStatus.forEach((status) => {
    if (status.checked) {
      customStakedTokens.push(status.token);
    }
  });
  if (customStakedTokens.length == 0) {
    return;
  }
  await doStake(customStakedTokens);
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
        showError(getUsefulError(err));
      });

      if (!stakeArray) {
        throw new Error("Unstaking was not successful");
      }

      const func = await unstakeAll(stakeArray).catch((err) => {
        showError(getUsefulError(err));
      });

      if (!func) {
        throw new Error("Unstaking was not successful");
      }

      const tx = await func
        .wait()
        .catch((err) => showError(getUsefulError(err)));

      if (!tx) {
        throw new Error("Unstaking was not successful");
      }

      showSuccess(
        `Successfully unstaked ${stakeArray.length} tokens! 👍`,
        3000
      );
      await updateInterface();
    } else {
      throw new Error("No Tokens to Unstake!");
    }
  } catch (e) {
    showError(getUsefulError(e));
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
    showError(getUsefulError(err));
  });
  const stakeAmount = await getStakedCount(webState.address).catch((err) => {
    showError(getUsefulError(err));
  });
  const stakedTokens = await getStakedTokenIds(webState.address).catch(
    (err) => {
      showError(getUsefulError(err));
    }
  );

  if (!stakeAmount || !availableTokens) {
    canStakeCount.value = 0;
    totalStakedCount.value = 0;
    approved.value = false;
    hunnyOwed.value = 0;
    return;
  }

  const stakedAmountInt = Number.parseInt(stakeAmount.toString());
  canStakeCount.value = availableTokens.length; //- stakedAmountInt; causes bug
  totalStakedCount.value = stakedAmountInt;
  approved.value = await isApproved();
  hunnyOwed.value = (await getHunnyOwed(stakedTokens)).toFixed(3);
  updateCustomStakingStatus(availableTokens);
}

async function getHunnyOwed(stakedTokens) {
  let totalTime = 0;
  for (let i = 0; i < stakedTokens.length; i++) {
    const time = await getStakedLength(stakedTokens[i]);
    totalTime += time;
  }
  return (totalTime / 86400) * 5;
}

function isCustomStakingBearsSelected() {
  for (let i = 0; i < customStakingStatus.length; i++) {
    if (customStakingStatus[i].checked) {
      return true;
    }
  }
  return false;
}

function updateCustomStakingStatus(availableTokens) {
  outer: for (let i = 0; i < availableTokens.length; i++) {
    const token = availableTokens[i];
    for (let j = 0; j < customStakingStatus; j++) {
      const status = customStakingStatus[j];
      if (status.token == token) continue outer;
    }
    customStakingStatus.push({
      token: token,
      checked: false,
    });
  }
  for (let i = 0; i < availableTokens.length; i++) {
    const token = availableTokens[i];
    let found = true;
    while (found) {
      found = customStakingStatus.find(
        (status) => !availableTokens.includes(status.token)
      );
      if (found != undefined) {
        for (let j = 0; j < customStakingStatus.length; j++) {
          if (customStakingStatus[j].token == found.token) {
            customStakingStatus.splice(j, 1);
          }
        }
      }
    }
  }
}

function getBearImage(token) {
  return "https://api.chillbear.club/images/" + token + ".png";
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
