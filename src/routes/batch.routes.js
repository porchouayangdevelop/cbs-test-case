import { Router } from "express";
import { query } from "express-validator";
import { batchControllers } from "../controllers/batch.controller.js";

const batchRouter = Router();

const batchRoutes = (app) => {
  batchRouter
    .route("/", query("batNum").isNumeric().notEmpty())
    .get(batchControllers.getJobs);

  return app.use("/api/v1/batch", batchRouter);
};

export default batchRoutes;
