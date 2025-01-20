import { createPools } from "../../configs/db.config.js";
import { exportToExcelStyle } from "../../utils/excelAdvance.js";

const cardlessService = {
  async getDcpTradeTransaction() {
    let pool;
    try {
      const pools = await createPools();
      pool = pools.dcp;

      const [rows] = await pool.query(
        `select *
  from (select rsvref_no,
               messageid,
               hostRequest,
               case hostrequest when '00' then 'COUNTER'
                                when '01' then 'MOBILE'
                                when '02' then 'ATM' end hostrequest_desc,
               transtype,
               mapacctno,
               ccy,
               rsvamt,
               descr,
               feetype,
               feeamt,
               accountno,
               tellerid,
               phoneno,
               create_time,
               update_time,
               status,
               case status when '1' then 'Reservation'
                           when '2' then 'Reversal'
                           when '3' then 'Expired'
                           when '4' then 'Unknown or fail'
                           when '5' then 'Withdrawal'
                           when '6' then 'Reversal Withdrawal' end     status_desc,
               response_code,
               response_message,
               txgath
          from trade_noncustomer a order by create_time desc)  trade `
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
