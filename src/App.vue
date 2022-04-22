<template>
  <router-view />
</template>
<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "App",
  data() {
    return {
      updateKey: 0,
    };
  },
  methods: {
    forceUpdate() {
      this.updateKey += 1;
    },
  },
});
</script>
