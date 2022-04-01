import atob from 'atob';

/*
  All of these keys will need to be shoved into a server for security.
 */
export const keys = {
  INFURA_KEY: atob(process.env.VUE_APP_INFURA_KEY)
}
