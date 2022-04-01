<template>
  <q-page class="flex">
    <div class="flex column full-width flex-center items-center q-pt-xl q-pb-xl">
      <div class="logo-holder">
        <q-img alt="Logo" src="~assets/logo.png" />
      </div>

      <div class="avatar-holder">
        <q-img class="circle" alt="Avatar" src="~assets/avatar.png" />
      </div>

      <div class="info-holder flex flex-center">
        <div :class="informationClasses">
          <div class="flex flex-center col-4 column">
            <div class="text-center q-pb-md title text-weight-bolder">Minted</div>
            <div class="text-center">{{mintRemainder}} / {{mintTotal}}</div>
          </div>
          <div class="flex flex-center col-4 column">
            <div class="text-center q-pb-md title text-weight-bolder">Price</div>
            <div class="text-center">{{mintPrice}} ETH</div>
          </div>
          <div class="flex flex-center col-4 column">
            <div class="text-center q-pb-md title text-weight-bolder">Wallet</div>
            <div class="text-center">{{connectionStateArray[connectionState].wallet}}</div>
          </div>
        </div>
      </div>

      <div v-if="isLoading">
        <q-inner-loading
          style="position: relative; background: none"
          showing
        />
      </div>
      <div v-else class="flex flex-center column">
        <div class="text-center q-pt-sm bear-font text-weight-bolder" style="font-size: 2.5rem">{{connectionStateArray[connectionState].status}}</div>
        <q-btn v-if="connectionState === 0 || connectionState === 2" class="connect-btn" size="large" @click="pressConnect">{{connectionStateArray[connectionState].text}}</q-btn>
        <div v-if="!invalidUser && isOg" class="flex row flex-center" style="gap: 24px">
          <q-btn class="connect-btn" size="large" @click="ogMint(1)">Og Mint 1</q-btn>
          <q-btn class="connect-btn" size="large" @click="ogMint(2)">Og Mint 2</q-btn>
        </div>
        <div v-if="!invalidUser && isPremint" class="flex row flex-center">
          <q-btn class="connect-btn" size="large" @click="preSaleMint(1)">Presale Mint 1</q-btn>
        </div>
        <div v-if="!invalidUser && isPublicMint" class="flex row flex-center">
          <q-btn class="connect-btn" size="large" @click="publicSaleMint(1)">Public Mint 1</q-btn>
        </div>
        <div v-if="invalidUser && connectionState !== 0" class="text-center q-pt-md">Sorry you are not whitelisted, please wait for Public sale</div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { computed, onMounted, reactive, ref } from "vue";
import { useStore } from 'vuex'
import { getState, signIn } from "src/scripts/web3modal";
import { getUsefulError, trimAddress } from "src/scripts/util";
import {
  contractAddress,
  opensea,
  network
} from "src/scripts/config"
import {
  doMint,
  doOgMint,
  doPreSaleMint, getMintCount,
  getMintingInfo,
  getSalesStatus,
  inWhitelist
} from "src/scripts/crypto";
import { ethers } from "ethers";

const $q = useQuasar()
const store = useStore()
const connectionStateArray = ref([
  { text: 'Connect', wallet: 'Please connect', status: 'Connect wallet to begin' },
  { text: 'Mint', wallet: '', status: 'Current status: -' },
  { text: 'Buy on OpenSea', wallet: '', status: 'Current status: Sold out!' }
])
const connectionState = ref(0);
const mintRemainder = ref(0);
const mintTotal = ref(0);
const mintPrice = ref(0);
const invalidUser = ref(false);
const isLoading = ref(true);
const isOg = ref(false);
const isPremint = ref(false);
const isPublicMint = ref(false);
const data = ref({
  ogMintSupply: 0,
  preMintSupply: 0,
  publicSaleSupply: 0,
  publicSalePrice: 0,
  ogPrice: 0,
  preSalePrice: 0,
  EIP2981RoyaltyPercentage: 0,
});

const informationClasses = computed(() => {
  const isMobile = $q.screen.lt.md;
  return `inner flex items-start ${isMobile ? 'column flex-center' : 'row flex-start'}`;
})

onMounted(() => {
  store.subscribe(async (mutation, state) => updateState())
  updateState();

  setTimeout(() => {
    isLoading.value = false;
  }, 500)
})

async function pressConnect() {
  switch(connectionState.value) {
    case 0:
      const state = getState();

      if (state.address) {
        showSuccess('Wallet connected to Chill Bear Club! 👍', 3000)
      } else {
        await signIn().catch(err => showError(getUsefulError(err)))
      }
      break;
    case 2:
      window.open(opensea[network].replace('ID', contractAddress).replace('TOKEN', ''), '_blank')
      break;
  }
}

async function ogMint(amount) {
  const output = await doOgMint(amount, data.value.ogPrice, 6)
    .catch(err => showError(getUsefulError(err)));

  if (!output) {
    return;
  }

  const tx = await output.wait()
    .catch(err => showError(getUsefulError(err)));

  if (!tx) {
    return;
  }

  showSuccess(`Successfully minted ${amount} tokens! 👍`, 3000)
  await updateInterface()
}

async function preSaleMint(amount) {
  const output = await doPreSaleMint(amount, data.value.preSalePrice, 5)
    .catch(err => showError(getUsefulError(err)));

  if (!output) {
    return;
  }

  const tx = await output.wait()
    .catch(err => showError(getUsefulError(err)));

  if (!tx) {
    return;
  }

  showSuccess(`Successfully minted ${amount} tokens! 👍`, 3000)
  await updateInterface()
}

async function publicSaleMint(amount) {
  const output = await doMint(amount, data.value.publicSalePrice, 3)
    .catch(err => showError(getUsefulError(err)));

  if (!output) {
    return;
  }

  const tx = await output.wait()
    .catch(err => showError(getUsefulError(err)));

  if (!tx) {
    return;
  }

  showSuccess(`Successfully minted ${amount} tokens! 👍`, 3000)
  await updateInterface()
}

async function updateState() {
  const webState = getState();
  connectionState.value = webState.address ? 1 : 0;
  invalidUser.value = true;

  if (webState.address) {
    connectionStateArray.value[1].wallet = trimAddress(webState.address);
    connectionStateArray.value[2].wallet = trimAddress(webState.address);

    $q.notify({
      message: 'Wallet connected to Chill Bear Club! 👍',
      color: 'green',
      position: 'bottom-right',
      actions: [
        { label: 'Ok', color: 'white', handler: () => { /* ... */ } }
      ],
      timeout: 3000
    })

    // check statuses
    await updateInterface()
  }
}

async function updateInterface() {
  const webState = getState();
  const [og, whitelist, normal] = await getSalesStatus();
  const whitelistText = 'OG and Presale minting live!';
  const mintText = 'Public minting live!';
  const noneText = 'Minting not started';
  connectionStateArray.value[1].status = `Current status: ${whitelist || og ? whitelistText : normal ? mintText : noneText}`;

  const mintInfo = await getMintingInfo();

  isPublicMint.value = normal;

  data.value.ogMintSupply = Number.parseInt(mintInfo.ogMintSupply);
  data.value.preMintSupply = Number.parseInt(mintInfo.preMintSupply);
  data.value.publicSaleSupply = Number.parseInt(mintInfo.publicSaleSupply);
  data.value.ogPrice = Number.parseFloat(ethers.utils.formatUnits(mintInfo.ogPrice.toString(), 'ether').toString());
  data.value.preSalePrice = Number.parseFloat(ethers.utils.formatUnits(mintInfo.preSalePrice.toString(), 'ether').toString());
  data.value.publicSalePrice = Number.parseFloat(ethers.utils.formatUnits(mintInfo.publicSalePrice.toString(), 'ether').toString());
  data.value.EIP2981RoyaltyPercentage = Number.parseFloat(mintInfo.EIP2981RoyaltyPercentage) / 100;

  mintTotal.value = 5555;
  mintRemainder.value = await getMintCount();

  const addressStatus = await inWhitelist(webState.address);
  if (!normal) {
    mintRemainder.value = 2 - data.value.ogMintSupply + 3 - data.value.preMintSupply;

    if (addressStatus[0] || addressStatus[1]) {
      isOg.value = addressStatus[0];
      isPremint.value = !addressStatus[0] && addressStatus[1];

      mintPrice.value =
        addressStatus[0] ? data.value.ogPrice :
          addressStatus[1] ? data.value.preSalePrice :
            0;

      invalidUser.value = false;
    } else {
      invalidUser.value = true;
    }
  } else if (normal) {
    mintPrice.value = data.value.publicSalePrice;
    invalidUser.value = false;
  }

  if (mintTotal.value === mintRemainder.value) {
    connectionState.value = 2;
    isOg.value = false;
    isPremint.value = false;
    isPublicMint.value = false;
  }
}

function showSuccess(msg, timeout) {
  $q.notify({
    message: msg,
    color: 'green',
    position: 'bottom-right',
    actions: [
      { label: 'Ok', color: 'white', handler: () => { /* ... */ } }
    ],
    timeout
  })
}

function showError(err) {
  $q.notify({
    message: err,
    color: 'red',
    position: 'bottom-right',
    actions: [
      { label: 'Ok', color: 'white', handler: () => { /* ... */ } }
    ]
  })
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
