import { Router } from "express";
import { cardlessController } from "../controllers/cardless.controller.js";

const router = Router();

const dcpTradeRoutes = (app) => {
  router
    .route("/cardless-transactions")
    .get(cardlessController.getDcpTradeTransaction);

  router.route("/download-url/:filename").get(cardlessController.downloadUrl);

  return app.use("/api/v1/dcp-trade", router);
};

export default dcpTradeRoutes;
