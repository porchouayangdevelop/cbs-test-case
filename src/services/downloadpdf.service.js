import fs from "fs";
import path from "path";
import Client from "ssh2-sftp-client";
import { fileURLToPath } from "url";
import { createPools } from "../configs/db.config.js";
import MySQLQueryBuilder from "../utils/MySQLQueryBuilder.js";
let builder = new MySQLQueryBuilder();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const downloadPath = path.join(
  process.cwd(),
  "resources",
  "downloads",
  "signature"
);

const bufferToBase64 = (buffer) => {
  return buffer.toString("base64");
};

const saveToBase64File = (base64Data, outPutPath) => {
  return new Promise(async (resolve, reject) => {
    const buffer = Buffer.from(base64Data, "base64");
    fs.writeFile(outPutPath, buffer, { encoding: "binary" }, (err) => {
      if (err) reject(err);
      else resolve(outPutPath);
    });
  });
};

const DownloadPDFService = {
  getImage: async (cif) => {
    let sftp;
    let pool;
    try {
      pool = await createPools();
      pool = pool.hbs;

      const { query, params } = builder
        .setType("query")
        .addTables("fts_file_info", "a")
        .where("a.CIF_ID", "=", [cif])
        .addSelect("a.FILE_STORE_ID, a.FILE_LINK_ID")
        .build();

      const [rows] = await pool.query(query, params);
      //   console.log(rows[0]?.FILE_STORE_ID);
      const fileStoreId = rows[0]?.FILE_STORE_ID;
      const fileLinkId = rows[0]?.FILE_LINK_ID;

      if (!fileStoreId) {
        throw new Error("No image found for the given CIF.");
      }

      sftp = new Client();

      return new Promise(async (resolve, reject) => {
        try {
          await sftp.connect({
            host: process.env.SFTP_HOST || "10.1.12.198",
            port: process.env.SFTP_PORT || 22,
            username: process.env.SFTP_USERNAME || "hbs",
            password: process.env.SFTP_PASSWORD || "Hsb@Apb2023",
          });

          const remotePath = `${
            process.env.SFTP_REMOTEPATH || "/shrdata/minio/data/hbs/"
          }${fileStoreId}`;
          console.log(`Connected to SFTP Server successfully`);

          const fileData = await sftp.get(remotePath);
          console.log(fileData);

          const localPath = `${downloadPath}/${fileStoreId}`;

          const saveFile = await sftp.fastGet(remotePath, localPath);
          console.log(`File saved at: ${localPath}`);

          const downloadUrl = `/download/${encodeURIComponent(fileStoreId)}`;

          return resolve({
            success: true,
            imageBuffer: saveFile,
            length: saveFile.length,
            fileName: fileStoreId,
            filePath: localPath,
            downloadUrl,
          });
        } catch (error) {
          reject(error);
        } finally {
          if (sftp) sftp.end();
        }
      });
    } catch (error) {
      console.error(error);
      if (sftp) sftp.end();
      throw error;
    } finally {
      if (pool) pool.end();
    }
  },
};

export { bufferToBase64, DownloadPDFService, saveToBase64File };
