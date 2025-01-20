import { CustomerService } from "../services/core/customer.service.js";

const customerController = {
  async getCustomer(req, res) {
    try {
      const { tableName } = req.body;
      if (!tableName) {
        return res
          .status(400)
          .json({ error: "Missing required parameter: tableName" });
      }
      const customer = await CustomerService.getCustomersCount(tableName);
      res.status(200).json({ data: customer });
    } catch (error) {
      res.status(500).json({ message: `Internal server error: ${error}` });
    }
  },
};

export { customerController };
