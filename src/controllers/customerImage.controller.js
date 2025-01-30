import fs from "fs";
import path from "path";
import { DownloadPDFService } from "../services/downloadpdf.service.js";
export const CustomerImagesController = {
  getImages: async (req, res) => {
    try {
      const { cif } = req.params;
      if (!cif) {
        return res.status(400).json({
          error: "Missing required parameter: cif",
          success: false,
        });
      }
      const result = await DownloadPDFService.getImage(cif);

      if (!result) {
        return res.status(404).json({
          error: "Customer not found",
          success: false,
        });
      }
      res.status(200).json({
        success: true,
        downloadUrl: result.downloadUrl,
        fileName: result.fileName,
        filePath: result.filePath,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: error.message,
        success: false,
        message: "Internal Server Error",
      });
    }
  },
  downloadUrl: async (req, res) => {
    try {
      const { fileStoreId } = req.params;
      const fileUrl = path.join(
        process.cwd(),
        "resources",
        "downloads",
        "signature",
        fileStoreId
      );
      if (fs.existsSync(fileUrl)) {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fileStoreId}"`
        );
        res.setHeader("Content-Type", "application/octet-stream");
        res.download(fileUrl, (err) => {
          if (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
          } else {
            fs.unlinkSync(fileUrl);
            res.status(200).json({ message: "File downloaded successfully" });
          }
        });
      } else {
        res.status(404).json({ error: "File not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  },
};
