import { createPools } from "../../configs/db.config.js";
import QueryBuilder from "../../utils/queryBuilder.js";
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

  async getCustomerInfo(tableName) {
    let pool;
    try {
      let pools = await createPools();
      pool = pools.core;
      const queryBuilder = new QueryBuilder(tableName);
      const { query } = queryBuilder.buildProcedureCallWithoutInputParameters();
    } catch (error) {
      console.log(`Error in getting customers`);
    }
  },
};

export { CustomerService };
