import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exportToExcelStyle = async (dt, fileName, options = {}) => {
  try {
    const {
      sheetName = "sheet1",
      headerStyle = {
        font: { bold: true, color: { rgb: "333333" } },
        fill: { fgColor: { rgb: "4472C4" } },
      },
      columnWidths = {},
    } = options;

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dt);
    ws["!cols"] = Object.keys(dt[0] || {}).map((keys) => ({
      wch: columnWidths[keys] || 15,
      hidden: keys.startsWith("__"),
    }));

    // custom headers
    const headerRanges = XLSX.utils.decode_range(ws["!ref"]);
    for (let c = headerRanges.s.c; c < headerRanges.e.c; c++) {
      const address = XLSX.utils.encode_cell({ r: 0, c: c });
      if (!ws[address]) continue;
      ws[address].s = headerStyle;
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const exportDir = path.join(process.cwd(), "resources", "exports");
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir, { recursive: true });

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const fileNameWithTime = `${fileName}_${ts}.xlsx`;
    const filePathWithTime = path.join(exportDir, fileNameWithTime);
    XLSX.writeFile(wb, filePathWithTime, {
      bookType: "xlsx",
      bookSST: false,
      type: "file",
      compression: true,
    });

    const downloadUrl = `/exports/${fileNameWithTime}`;

    return {
      success: true,
      filePath: filePathWithTime,
      fileName: fileNameWithTime,
      downloadUrl,
      message: `Your file has been successfully exported to ${filePathWithTime}`,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Failed to export to Excel",
    };
    // throw new Error(`Error exporting to Excel: ${error}`);
  }
};

export { exportToExcelStyle };
