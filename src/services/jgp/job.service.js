import path from "path";
import { createPools } from "../../configs/db.config.js";
import MySQLQueryBuilder from "../../utils/MySQLQueryBuilder.js";
import { DocxExporter } from "../../utils/docxExport.js";
import businessDate from "../core/business_date.service.js";

const docxExport = new DocxExporter({
  exportDir: path.join(process.cwd(), "resources", "exports"),
});

const builder = new MySQLQueryBuilder();
const jobService = {
  async getJobDetails() {
    let pool;
    try {
      let pools = await createPools();
      pools = pools.jgp;

      const [rows] = await pool.query(``);

      return rows;
    } catch (error) {}
  },

  async getJobs(batNum) {
    let pool;
    try {
      pool = await createPools();
      pool = pool.jgp;

      const [rows] = await pool.query(
        `select case a.batname
           when 'apb_core' then 'core'
           when 'apb_aml' then 'aml'
           when 'apb_stp' then 'stp'
           when 'apb_report' then 'report'
           end                                                                       as module,
       a.batnum,
       date_format(a.batnum, '%Y-%m-%d')                                             as batch_date,
       date_format(a.batnum, '%r')                                                   as start_time,
       date_format(a.endtime, ' %r')                                                 as end_time,
       timediff(max(date_format(a.endtime, '%r')), min(date_format(a.batnum, '%r'))) as usagetime,
       case a.status
           when 'STOPPED' then 'SUCCESS' end                                            status
  from batch a where a.batnum like concat('%',?,'%') and a.batname not like '%ATP%' group by a.batnum, a.batname order by a.batnum, usagetime desc limit 4;`,
        [batNum]
      );
      return rows;
    } catch (error) {
      console.log(`Error getting jobs for ${batNum}: ${error}`);
    }
  },

  async getBatchEod(batNum) {
    let pool;
    try {
      pool = await createPools();
      pool = pool.jgp;

      const { query, params } = builder
        .setType("procedure")
        .setProcedures("proc_get_batch_eod", [batNum])
        .build();
      const [rows] = await pool.execute(query, params);

      const result = rows[0].map((item, index) => {
        return {
          id: index + 1,
          Module: item.module,
          // batNum: item.batNum,
          batchDate: item.batch_date,
          StartTime: item.start_time,
          EndTime: item.end_time,
          Status: item.status,
          // Remarks: "",
        };
      });

      // const data = {
      //   batDate: result[0].batchDate,
      //   FullName: "Porchouayang VAJONG",
      //   StartTime: result[0].StartTime,
      //   EndTime:
      //     result[0].Module === "Report"
      //       ? result[0].EndTime
      //       : "....................",
      //   statuses: result,
      // };

      // docxExport.exportToDocx(data);
      // console.log(result);

      return result;
    } catch (error) {
      console.error(error);
    }
  },

  async getMaxId() {
    let pool;
    try {
      let pools = await createPools();
      pool = pools.cbs_pwc;
      const [rows] = await pool.execute(
        `select max(id) as maxId from pwc_documentation;`
      );
      return rows[0].maxId;
    } catch (error) {
      console.error(error);
    }
  },

  async cbsPwcDocument(fullName, batNum, descriptions, remarks) {
    let pool;
    let bTime;
    let eTime;
    let output, output1;
    try {
      pool = await createPools();
      pool = pool.cbs_pwc;
      const maxId = await this.getMaxId();

      const result = await this.getBatchEod(batNum);
      bTime = result[0].Module === "Core" ? result[0].StartTime : "";
      eTime = result[0].Module === "Report" ? result[0].EndTime : "";
      const { query, params } = builder
        .setType("procedure")
        .setProcedures("proc_pwc_documentation", [
          `${fullName}`,
          `${bTime}`,
          `${eTime}`,
          `${await businessDate.getBusinessDates()}`,
        ])
        .build();
      output = await pool.execute(query, params);
      console.info(output);
      for (let i in result) {
        const el = result[i];
        const { query, params } = builder
          .setType("procedure")
          .setProcedures("proc_process_pwc_details", [
            `${output[0].insertId}`,
            `${el.Module}`,
            `${batNum}`,
            `${result[0].batchDate}`,
            `${el.StartTime}`,
            `${el.EndTime}`,
            `${descriptions}`,
            `${el.Status}`,
            `${remarks}`,
          ])
          .build();

        output1 = await pool.execute(query, params);
      }

      console.info(output1);
      return {
        id: output[0].insertId,
        success: true,
      };
    } catch (error) {
      console.error(error);
    }
  },
};

export default jobService;
