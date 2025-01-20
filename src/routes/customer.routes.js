import { Router } from "express";
import { query } from "express-validator";
import { customerController } from "../controllers/customer.controller.js";

const router = Router();

const customerRoutes = (app) => {
  router
    .route("/", query("tableName").notEmpty().isString())
    .get(customerController.getCustomer);

  return app.use("/api/v1/customers", router);
};

export default customerRoutes;
