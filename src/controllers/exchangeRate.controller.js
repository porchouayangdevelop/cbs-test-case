import exchangeRateService from "../services/exchangeRate.service.js";
const exchangeControllers = {
  async getExchangeRate(req, res) {
    const { ccy } = req.query;
    if (!ccy) {
      return res.status(400).json({ error: "Missing required parameter: ccy" });
    }
    try {
      const rows = await exchangeRateService.getExchangeRate(ccy);
      if (rows.length > 0) {
        res.status(200).json({ data: rows });
      } else {
        res.status(404).json({ error: "Exchange rate not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error, message: "INTERNAL SERVER ERROR" });
    }
  },

  async convertCurrency(req, res) {
    const { amount, currencyFrom, currencyTo } = req.body;
    if (!amount || !currencyFrom || !currencyTo) {
      return res.status(400).json({
        error: "Missing required parameters: amount, currencyFrom, currencyTo",
      });
    }
    try {
      const result = await exchangeRateService.convertCurrency(
        amount,
        currencyFrom.toUpperCase(),
        currencyTo.toUpperCase()
      );
      res.status(200).json({ result });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error, message: "INTERNAL SERVER ERROR" });
    }
  },
};

export default exchangeControllers;
