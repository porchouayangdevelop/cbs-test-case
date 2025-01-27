import { createPools } from "../../configs/db.config.js";
import MySQLQueryBuilder from "../../utils/MySQLQueryBuilder.js";

const builder = new MySQLQueryBuilder();
const main = new MySQLQueryBuilder();
const subQuery1 = new MySQLQueryBuilder();
const subQuery2 = new MySQLQueryBuilder();

const CustomerService = {
  async getCustomersCount() {
    let pool;
    try {
      let pools = await createPools();
      pool = pools.core;
    } catch (error) {
      console.error(error);
    }
  },

  async getCustomerInfo() {
    let pool;
    try {
      let pools = await createPools();
      pool = pools.core;

      const { query, params } = builder
        .setType("query")
        .addTables("citcus", "a")
        .addJoins("citpdem p", "a.ci_no = p.ci_no", "left")
        .addJoins("citacr ac", "a.ci_no = ac.ci_no", "left")
        .addSelect([
          "a.ci_no",
          "a.chn_name",
          "a.eng_name",
          "p.sex",
          "p.date_birth",
          "a.create_date",
          "ac.act_no",
          "ac.prd_code",
        ])
        // .addConcat(["a.chn_name", "a.eng_name"], "name")
        .addDateFormat("a.create_date", "%d/%m/%Y", "create_date")
        .addDateFormat("p.date_birth", "%d/%m/%Y", "date_birth")
        .addCase({
          field: `p.sex`,
          // searched: true,
          when: [
            {
              // condition: "p.sex = ?",
              value: "2",
              result: "'Female'",
              // params: ["2"],
            },
            {
              // condition: "p.sex = ?",
              value: "3",
              result: "'Male'",
              // params: ["3"],
            },
          ],
          // else: "'null'",
          alias: "sex",
        })
        .whereIn("a.cust_type ", ["P", "C"])
        .addOrder("a.updtbl_date", "DESC")
        .addLimit(10)
        .addOffset(1)
        .build();

      const [rows] = await pool.query(query, params);

      // console.log("rows", rows);

      return rows;
    } catch (error) {
      console.error(error);
      // throw new Error(`Error in getting customers: ${error}`);
    }
  },

  async debitInfo() {
    let pool;
    try {
      pool = await createPools();
      pool = pool.core;
      const { query, params } = builder
        .setType("procedure")
        .setProcedures("proc_debit_credit_master", ["000048749950", "D"])
        .build();
      const [rows] = await pool.execute(query, params);
      console.log(query, params);

      console.log("rows", rows);
      return rows;
    } catch (error) {
      console.error(error);
    }
  },
};

export { CustomerService };
