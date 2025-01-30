import { config } from "dotenv";
import mysql from "mysql2/promise";
import getConfig from "./appConfig.js";

import globalEnv from "./../globalEnv.js";

config();

const poolConfig = {
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const createPools = async () => {
  try {
    const appConfig = getConfig(globalEnv.getEnvironment());

    const pools = {};
    const databases = ["core", "ods", "jgp", "dcp", "cbs_pwc", "hbs"];

    for (const db of databases) {
      pools[db] = mysql.createPool({
        ...appConfig[db],
        ...poolConfig,
      });
    }
    globalEnv.setPools(pools);

    return pools;
  } catch (error) {
    console.log(
      `Database connection failed for ${globalEnv.getEnvironment()} mode with error: ${error}`
    );
  }
};

export { createPools };
