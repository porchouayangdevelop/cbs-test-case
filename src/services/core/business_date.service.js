import { createPools } from "../../configs/db.config.js";

const businessDate = {
  async getBusinessDates() {
    let pool;

    try {
      const pools = await createPools();
      pool = pools.core;

      const [rows] = await pool.query(
        `select
        date_format(s.AC_DATE , '%Y-%m-%d') as prev_dt, 
        date_format(s.NEXT_AC_DATE , '%Y-%m-%d') as current_dt,
        date_format(s.LAST_AC_DATE , '%Y-%m-%d') as last_dt from  sctjpam s ;`
      );
      return rows[0].current_dt;
    } catch (error) {
      console.log(`Failed to connect to business_date table: ${error}`);
    }
  },
};

export default businessDate;
