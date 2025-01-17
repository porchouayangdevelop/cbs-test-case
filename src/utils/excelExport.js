import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exportToExcel = async (dt, fileName, sheetName) => {
  try {
    const wb = XLSX.utils.book_new();

    const ws = XLSX.utils.json_to_sheet(dt);

    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const filePath = path.join(__dirname, "../../resources/exports");
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, { recursive: true });
    }

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const fileNameWithTime = `${fileName}_${ts}.xlsx`;
    const filePathWithTime = path.join(filePath, fileNameWithTime);

    XLSX.writeFile(wb, filePathWithTime);

    return {
      success: true,
      filePath: filePathWithTime,
      message: `Your file has been successfully exported to ${filePathWithTime}`,
    };
  } catch (error) {
    console.error(`Failed to export to Excel: ${error}`);
    return {
      success: false,
      message: "Failed to export to Excel",
    };
    // throw new Error(`Failed to export to Excel: ${error}`);
  }
};

export { exportToExcel };
