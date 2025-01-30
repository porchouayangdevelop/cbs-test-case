import { Router } from "express";
import { LoanTermSchedulesController } from "../controllers/loanTermSchedule.controller.js";

const loadRouter = Router();

const loanRoutes = (app) => {
  loadRouter
    .route("/term")
    .post(LoanTermSchedulesController.getLoanTermSchedules);

  return app.use("/api/v1/loans", loadRouter);
};

export default loanRoutes;
