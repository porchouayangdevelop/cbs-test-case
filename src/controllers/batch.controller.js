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
};

export { batchControllers };
