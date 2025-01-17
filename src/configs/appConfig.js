import { config } from "dotenv";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config();

const appConfig = {
  development: {
    core: {
      host: process.env.DB_HOST || "10.151.145.165",
      port: parseInt(process.env.DB_PORT) || parseInt(3306),
      user: process.env.DB_USER || "core",
      password: process.env.DB_PASSWORD || "Dba21@Apb2024",
      database: process.env.DB_NAME || "core001",
    },
    ods: {
      host: process.env.DB_HOST || "10.151.145.165",
      port: parseInt(process.env.DB_PORT) || parseInt(3306),
      user: process.env.ODS_USER || "ods",
      password: process.env.ODS_PASSWORD || "Dba26@Apb2024",
      database: process.env.ODS_DBNAME || "ods",
    },
    jgp: {
      host: process.env.DB_HOST || "10.151.145.176",
      port: parseInt(process.env.DB_PORT) || parseInt(3306),
      user: process.env.JGP_USER || "jgp",
      password: process.env.JGP_PASSWORD || "Dba22@Apb2024",
      database: process.env.JGP_DBNAME || "jgp",
    },
    dcp: {
      host: process.env.DB_HOST || "10.151.145.165",
      port: parseInt(process.env.DB_PORT) || parseInt(3306),
      user: process.env.DCP_USER || "dcp_trade",
      password: process.env.DCP_PASSWORD || "Dba23@Apb2024",
      database: process.env.DCP_DBNAME || "dcp_trade",
    },
  },
  production: {
    core: {
      host: process.env.DB_PHOST || "10.151.101.200",
      port: parseInt(process.env.DB_PPORT) || parseInt(4008),
      user: process.env.DB_PUSER || "porchouayang",
      password: process.env.DB_PPASSWORD || "Pcy32@2024",
      database: process.env.DB_PNAME || "core001",
    },
    ods: {
      host: process.env.ODS_PHOST || "10.151.101.201",
      port: parseInt(process.env.DB_PPORT) || parseInt(4008),
      user: process.env.ODS_PUSER || "porchouayang",
      password: process.env.ODS_PPASSWORD || "Porchouayang32@2024",
      database: process.env.ODS_PDBNAME || "ods",
    },
    jgp: {
      host: process.env.JPG_PHOST || "10.151.101.135",
      port: parseInt(process.env.DB_PPORT) || parseInt(4008),
      user: process.env.JGP_PUSER || "porchouayang",
      password: process.env.JGP_PPASSWORD || "Pcy32@2024",
      database: process.env.JGP_PDBNAME || "jgp",
    },
    dcp: {
      host: process.env.DCP_PHOST || "10.151.101.205",
      port: parseInt(process.env.DB_PPORT) || parseInt(4008),
      user: process.env.DCP_PUSER || "porchouayang",
      password: process.env.DCP_PPASSWORD || "Pcy32@2024",
      database: process.env.DCP_PDBNAME || "dcp_trade",
    },
  },
};

const getConfig = (environment) => {
  const env = environment;

  return appConfig[env];
};

export default getConfig;
