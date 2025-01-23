import { createPools } from "../../configs/db.config.js";
import MySQLQueryBuilder from "../../utils/MySQLQueryBuilder.js";
import QueryBuilder from "../../utils/queryBuilder.js";

const builder = new MySQLQueryBuilder();
const CustomerService = {
  async getCustomersCount(tableName) {
    let pool;
    try {
      let pools = await createPools();
      pool = pools.core;
      const queryBuilder = new QueryBuilder(tableName);
      const { query } = queryBuilder.buildCountNoWhereClause();

      const [rows] = await pool.query(query);

      console.log("rows", rows);

      return rows[0];
    } catch (error) {
      console.log("Error in getting pools", error);
      throw new Error("Error in getting pools: " + error);
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
          // else: "Unknown",
          alias: "sex",
        })
        .whereIn("a.cust_type ", ["P", "C"])
        .addOrder("a.updtbl_date", "DESC")
        .addLimit(10)
        .addOffset(0)
        .build();

      const [rows] = await pool.query(query, params);

      console.log("rows", rows);

      return rows;
    } catch (error) {
      console.log(`Error in getting customers : ${error}`);
    }
  },
};

export { CustomerService };
