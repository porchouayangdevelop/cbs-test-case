import { sshService } from "../services/ssh.service.js";

const sshController = {
  async sshConnect(req, res) {
    try {
      const { host, username, password, command } = req.body;
      if (!host || !username || !password) {
        return res.status(400).json({
          success: false,
          error: "Missing required parameters",
          details: "host, username, password",
        });
      }
      const result = await sshService.connectSshServer(
        host,
        username,
        password,
        command
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error,
        message: "Internal Server Error",
      });
    }
  },
};

export { sshController };
