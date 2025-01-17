import { config } from "dotenv";
config();

class GlobalEnvironment {
  constructor() {
    this._env = this._initialEnvironment();

    this._businessDate = null;
    this._pools = null;
    this._port = this._initialPort();
    this._businessMode = this._initialBusinessMode();
    this._route = this._initialRoute();
  }

  _initialRoute() {
    const prefix = "/api/v1/";
    const routesName = {};
    const routes = [];

    const dynamicRoutes = {
      ...routesName,
    };

    // Dynamically load routes
    for (let key in dynamicRoutes) {
      dynamicRoutes[key](prefix).then((routes) => {
        this._route = routes;
      });
    }
    return routes;
  }

  getRoutes() {
    return this._route;
  }

  setRoute(route) {
    this._route = route;
  }

  _initialEnvironment() {
    return process.env.NODE_ENV !== "production" ? "development" : "production";
  }

  _initialPort() {
    if (this._env === "production") {
      return (this._port = parseInt(3001));
    }

    return (this._port = parseInt(3000));
  }
  getPort() {
    return this._port;
  }

  setPort(port) {
    this._port = port;
  }

  getEnvironment() {
    return this._env;
  }

  setEnvironment(env) {
    if (env === "production" || env === "development") {
      this._env = env;
      console.log(`You are running in ${this._env.toUpperCase()} mode`);

      this._businessMode = this._initialBusinessMode();

      this._port = this._initialPort();
      return true;
    }
    throw new Error("Invalid environment");
  }

  setBusinessDate(businessDate) {
    this.businessDate = businessDate;
  }

  getBusinessDate() {
    return this.businessDate;
  }

  setPools(pools) {
    // console.log(`Database connection  for ${pools} mode`);
    this._pools = pools;
  }

  getPools() {
    return this._pools;
  }

  _initialBusinessMode() {
    if (this._env === "development") {
      return "UAT";
    }
    return "PROD";
  }

  getBusinessMode() {
    return this._businessMode;
  }

  setBusinessMode(mode) {
    this._businessMode = mode;
  }
}

const globalEnv = new GlobalEnvironment();

export default globalEnv;
