import { createPools } from "../configs/db.config.js";

const exchangeRateService = {
  async getExchangeRate(ccy) {
    const connection = await createPools();
    const env =
      process.env.NODE_ENV !== "production" ? "development" : "production";

    try {
      const pools =
        env === "development"
          ? await connection.core
          : await connection.production;

      const [rows] = await pools.query(
        `SELECT 
      a.ccy, a.exr_typ, a.fx_buy,a.fx_sell,a.updtbl_date,a.upd_tlr,a.ts
      FROM bpttqp a WHERE  a.ccy = ? and exr_typ = ? order by ? desc`,
        [ccy.toUpperCase(), "SMR", "ts"]
      );
      // console.log(rows);
      const result = rows.map((val, i) => {
        // const { ccy, exr_typ, fx_buy, fx_sell, updtbl_date, upd_tlr, ts } = val;
        // console.log(val.ccy);
        const obj = {
          ccy: val.ccy,
          type: val.exr_typ,
          rate_buy: parseFloat(val.fx_buy).toFixed(2),
          rate_sell: parseFloat(val.fx_sell).toFixed(2),
          up_dt: val.updtbl_date,
          teller: val.upd_tlr,
          ts: val.ts.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          }),
        };

        return obj;
      });
      return result;
    } catch (error) {
      console.log(error);
    }
  },

  async convertCurrency(amount, currencyFrom, currencyTo) {
    const usd = currencyTo || "USD";

    const result = await this.getExchangeRate(usd);

    const output = parseFloat(amount.toFixed(2)) / result[0].rate_buy;

    console.log(`Converting ${amount} ${currencyFrom} to ${currencyTo}`);

    console.log(
      `output: ${amount.toFixed(2)}/${result[0].rate_buy} = ${parseFloat(
        output.toFixed(2)
      )}`
    );

    return output.toFixed(2);
  },
};

export default exchangeRateService;
