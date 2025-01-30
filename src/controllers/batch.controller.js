import jobService from "../services/jgp/job.service.js";
const batchControllers = {
  async getJobs(req, res) {
    try {
      const { batNum } = req.query;
      if (!batNum) {
        return res.status(400).json({
          error: `Missing required parameter: batNum in request ${batNum}`,
        });
      }

      const jobs = await jobService.getJobs(batNum);
      res.status(200).json({
        data: jobs,
      });
    } catch (error) {
      res.status(500).json({
        error: error,
        message: "Internal Server Error",
      });
    }
  },

  async getBatches(req, res) {
    try {
      const { batNum } = req.params;
      if (!batNum) {
        return res.status(400).json({
          error: `Missing required parameter: batNum in request ${batNum}`,
        });
      }

      const batches = await jobService.getBatchEod(batNum);
      res.status(200).json({
        data: batches,
      });
    } catch (err) {
      res.status(500).json({
        error: err,
        message: "Internal Server Error",
      });
    }
  },

  async process_pwc(req, res) {
    try {
      const { batNum } = req.params;
      const { fullName, remarks } = req.body;
      const result = await jobService.cbsPwcDocument(fullName, batNum, remarks);
      res.status(200).json({
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        error: error,
        message: "Internal Server Error",
      });
    }
  },
};

export { batchControllers };
