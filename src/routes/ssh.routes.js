import { Router } from "express";
import { sshController } from "../controllers/ssh.controller.js";
const sshRouter = Router();

const sshRoutes = (app) => {
  sshRouter.route("/connect").post(sshController.sshConnect);

  return app.use("/api/v1/ssh", sshRouter);
};

export default sshRoutes;
