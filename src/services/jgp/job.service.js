import { createPools } from "../../configs/db.config.js";
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
};

export default jobService;
