import { exec } from "child_process";


/**
 * turn exec into a promise
 * @params {string} command
 * @returns {Promise<string>}
 */
export const execPromise = (command: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout.trim());
    });
  });
};

export default execPromise;