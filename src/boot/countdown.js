import { boot } from 'quasar/wrappers'
import vueAwesomeCountdown from 'vue-awesome-countdown'

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot(async ({ app, router }) => {
  // something to do
  app.use(vueAwesomeCountdown, 'vac')
})
