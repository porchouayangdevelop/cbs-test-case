import fs from "fs";
import path from "path";
import { cardlessService } from "../services/dcp/cardless.service.js";
const cardlessController = {
  getDcpTradeTransaction: async (req, res) => {
    try {
      const result = await cardlessService.getDcpTradeTransaction();

      res.status(200).json({
        success: true,
        downloadUrl: result.downloadUrl,
        fileName: result.fileName,
        filePath: result.filePath,
        data: result.data,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
        message: "Internal Server Error",
      });
    }
  },

  downloadUrl: async (req, res) => {
    try {
      const { filename } = req.params;
      const fileUrl = path.join(
        process.cwd(),
        "resources",
        "exports",
        filename
      );
      if (fs.existsSync(fileUrl)) {
        res.download(fileUrl);
      } else {
        res.status(404).json({ error: "File not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
};

export { cardlessController };
