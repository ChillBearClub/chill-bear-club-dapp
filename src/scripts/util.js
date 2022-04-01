import { ethers } from "ethers";

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function trimAddress(address) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}

export function getUsefulError(e) {
  //console.log(typeof e)
  if (typeof e === 'object') {
    const msg = e.message;
    e = msg;

    if (msg.toString().includes('\'')) {
      const start = msg.indexOf('\'');
      const end = msg.lastIndexOf('\'');
      const jsonString = msg.substring(start + 1, end);
      //console.log(jsonString)
      const json = JSON.parse(jsonString);

      return json.value.data.message;
    }
  }

  let err = e.toString();
  if (err.startsWith('Error: ')) {
    err = err.substring(7);
  }

  return err;
}
