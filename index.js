import express from "express";

const app = express();

import http from "http";
import promClient from "prom-client";

const server = http.createServer(app);

import cors from "cors";
import logger from "morgan";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import globalEnv from "./src/globalEnv.js";
import businessDate from "./src/services/core/business_date.service.js";

const PORT = process.env.PORT;

const register = new promClient.Registry();

// Initialize the middleware
app.use(
  cors({
    origin: "*",
  })
);
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const envMode =
  process.env.NODE_ENV || "development" ? "development" : "production";

globalEnv.setEnvironment("development");

promClient.collectDefaultMetrics({
  app: "nodejs-applications-monitor",
  prefix: "node_",
  timeout: 5000,
  register,
});

const httpRequestTotal = new promClient.Counter({
  name: "http_request_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "status", "path"],
  registers: [register],
});

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequestTotal.labels(req.method, req.path, res.statusCode).inc();
  });
  next();
});

app.get("/", (req, res) => {
  res.send(`Hello from Node.js! Server: ${process.env.HOSTNAME}`);
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Expose metrics endpoint for Prometheus
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

app.use(
  "/exports",
  express.static(path.join(process.cwd(), "resources", "exports"))
);

// initialize routes
import batchRoutes from "./src/routes/batch.routes.js";
import dcpTradeRoutes from "./src/routes/dcp.routes.js";
import exchangeRateRoutes from "./src/routes/exchangeRate.routes.js";
exchangeRateRoutes(app);
batchRoutes(app);
dcpTradeRoutes(app);

console.log(
  `Core Banking System ${globalEnv.getBusinessMode()} business date is: ${await businessDate.getBusinessDates()}`
);

const startServer = async () => {
  server.listen(globalEnv.getPort(), "0.0.0.0", () => {
    console.log(
      `Server is running on port http://localhost:${globalEnv.getPort()} in port ${globalEnv
        .getEnvironment()
        .toUpperCase()} mode`
    );
  });
};

startServer().catch((err) => {
  console.error(`error: ${err}`);
  process.exit(1);
});
