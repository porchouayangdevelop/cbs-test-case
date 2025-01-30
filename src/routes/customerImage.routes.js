import { Router } from "express";
import { CustomerImagesController } from "../controllers/customerImage.controller.js";
const imageRouter = Router();

const routes = (app) => {
  imageRouter.route("/:cif").get(CustomerImagesController.getImages);
  imageRouter
    .route("/download/:fileStoreId")
    .get(CustomerImagesController.downloadUrl);

  return app.use("/api/v1/images", imageRouter);
};

export default routes;
