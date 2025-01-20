import QueryBuilder from "../../utils/queryBuilder.js";
const tellerService = {
  async getTellers(tableName) {
    let pool;
    try {
      let pools = await createPools();
      pool = pools.core;
      const queryBuilder = new QueryBuilder(tableName);
      const { query } = queryBuilder.buildSelectWhereClause();
      const [rows] = await pool.query(query);
      return rows;
    } catch (error) {
      console.log("Error in getting pools", error);
      throw new Error("Error in getting pools: " + error);
    }
  },
};

export { tellerService };
