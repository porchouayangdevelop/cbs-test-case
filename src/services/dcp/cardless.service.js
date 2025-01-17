import { createPools } from "../../configs/db.config.js";
import { exportToExcelStyle } from "../../utils/excelAdvance.js";

const cardlessService = {
  async getDcpTradeTransaction() {
    let pool;
    try {
      const pools = await createPools();
      pool = pools.dcp;

      const [rows] = await pool.query(
        `select * from dcp_trade.trade_noncustomer tn order by tn.create_time desc;`
      );

      // const exports = exportToExcel(
      //   rows,
      //   "dcp_trade_transaction",
      //   "dcp_trade_transaction"
      // );

      const advanceExport = await exportToExcelStyle(
        rows,
        "dcp_trade_transaction",
        {
          sheetName: "dcp_trade_transaction",
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "4472C4" } },
          columnWidths: {},
        }
      );

      // console.log(exports);
      console.log(advanceExport);

      return {
        success: true,
        downloadUrl: advanceExport.downloadUrl,
        fileName: advanceExport.fileName,
        filePath: advanceExport.filePath,
        data: rows,
      };
    } catch (error) {
      console.error("Error in getDcpTradeTransaction", error);
      throw new Error(`Error in getDcpTradeTransaction: ${error}`);
    }
  },
};

export { cardlessService };
