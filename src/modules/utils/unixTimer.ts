import { exec } from "child_process";


/**
 * @description get unix time in milisecond format 
 * @params {string} tag
 */
export const unixTimer = (tag: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec("date +%s%3N", (error, stdout, stderr) => {
      if (error) {
        reject(error);
      }
      if (stderr) {
        reject(stderr);
      }
      console.log(`${tag}: ${stdout}`);
      resolve(stdout);
    });
  });
};

export default unixTimer;