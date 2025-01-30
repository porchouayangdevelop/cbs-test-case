import { LoanTermSchedulesService } from "../services/core/loanTermSchedules.service.js";
const LoanTermSchedulesController = {
  async getLoanTermSchedules(req, res) {
    try {
      return {
        success: true,
        data: await LoanTermSchedulesService.getLoanTermSchedules(),
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: error,
        message: "INTERNAL SERVER ERROR",
      };
    }
  },
};

export { LoanTermSchedulesController };
