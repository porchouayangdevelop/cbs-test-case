import { Router } from "express";
import { param, query } from "express-validator";
import { batchControllers } from "../controllers/batch.controller.js";

const batchRouter = Router();

const batchRoutes = (app) => {
  batchRouter
    .route("/", query("batNum").isNumeric().notEmpty())
    .get(batchControllers.getJobs);
  batchRouter.get(
    "/:batNum",
    param("batNum").isNumeric().notEmpty(),
    batchControllers.getBatches
  );

  return app.use("/api/v1/batch", batchRouter);
};

export default batchRoutes;
