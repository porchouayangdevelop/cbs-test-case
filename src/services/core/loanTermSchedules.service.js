import { createPools } from "../../configs/db.config.js";
import { exportToExcelStyle } from "../../utils/excelAdvance.js";
const LoanTermSchedulesService = {
  async getLoanTermSchedules() {
    let pool;
    try {
      let pools = await createPools();
      pool = pools.core;
      const [rows] = await pool.query(`
                with loan_tern_alls as (select a.contract_no,
                                 case
                                     when a.amt_typ = 'P' then 'ຕົ້ນທຶນ'
                                     when a.amt_typ = 'I' then 'ດອກເບ້ຍ'
                                     when a.amt_typ = 'C' then 'Instalments'
                                     end as types,
                                 a.val_dt,
                                 a.due_dt,
                                 a.term,
                                 a.outstanting_bal,
                                 a.p_rec_amt,
                                 a.p_pay_amt,
                                 a.i_rec_amt,
                                 a.i_pay_amt
                            from lnttrcv a),
       loan_act as (select b.contract_no,
                           b.ci_no,
                           b.status,
                           b.val_dt,
                           b.due_dt,
                           b.ln_tot_amt,
                           b.draw_tot_amt
                      from lntloan b),
       cus as (select c.ci_no,
                      c.chn_name
                 from citcus c)
select c1.chn_name,
       a1.contract_no,
       a1.due_dt,
       a1.term,
       a1.types,
       a1.outstanting_bal,
       a1.p_rec_amt                as 'principal paid',
#        a1.p_pay_amt,
       a1.i_rec_amt                as 'interest paid',
#        a1.i_pay_amt,
       a1.p_rec_amt + a1.i_rec_amt as 'total repayment'
#        sum(a1.p_rec_amt),
#        sum(a1.i_rec_amt)
  from loan_tern_alls a1
           left join loan_act b1 on a1.contract_no = b1.contract_no
           left join cus c1 on b1.ci_no = c1.ci_no`);

      const advanceExport = await exportToExcelStyle(
        rows,
        "loan_term_schedules",
        {
          sheetName: "loan_term_schedules",
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

      //   return rows;
    } catch (error) {
      console.error(error);
    }
  },
};

export { LoanTermSchedulesService };
