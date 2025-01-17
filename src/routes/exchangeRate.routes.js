import { Router } from "express";
import { body, query } from "express-validator";

import exchangeControllers from "../controllers/exchangeRate.controller.js";

const exchangeRateRouter = Router();

const routes = (app) => {
  exchangeRateRouter
    .route("/", query("ccy").isString().isLength({ min: 3, max: 3 }).notEmpty())
    .get(exchangeControllers.getExchangeRate);

  exchangeRateRouter
    .route(
      "/convert",
      body("amount").isNumeric().notEmpty(),
      body("currencyFrom").isString().isLength({ min: 3, max: 3 }).notEmpty(),
      body("currencyTo").isString().isLength({ min: 3, max: 3 }).notEmpty()
    )
    .post(exchangeControllers.convertCurrency);

  return app.use("/api/v1/exchange-rate", exchangeRateRouter);
};

export default routes;
