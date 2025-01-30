import { Client } from "ssh2";
const sshService = {
  async connectSshServer(host, username, password, command) {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      let dataBuffer = "";

      const formatOutput = (output) => {
        return output
          .toString()
          .replace(/\\n/g, "\n\t") // Replace \n with actual newline and tab
          .replace(/^\t/, "") // Remove leading tab from first line
          .replace(/\n\t$/, "\n") // Remove tab from last line if it ends with newline
          .replace(/\\"/g, '"');
      };

      conn.on("ready", () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            reject({
              success: false,
              error: `Failed to execute command`,
              details: err.message,
            });
            return;
          }

          stream.on("data", (data) => {
            dataBuffer += data.toString();
          });

          stream.on("close", (code) => {
            conn.end();
            if (code === 0) {
              resolve({
                success: true,
                output: formatOutput(dataBuffer),
              });
            } else {
              reject({
                success: false,
                error: `Command execution failed`,
                exitCode: `Exit code: ${code}`,
                output: dataBuffer.trim(),
              });
            }
          });

          stream.stderr.on("data", (data) => {
            dataBuffer += data.toString();
          });
        });
      });
      conn.on("error", (err) => {
        reject({
          success: false,
          error: `Failed to connect to SSH server`,
          details: err.message,
        });
      });

      conn.connect({
        host,
        username,
        password,
        readyTimeout: 5000,
        tryKeyboard: false,
        algorithms: {
          kex: [
            "ecdh-sha2-nistp256",
            "ecdh-sha2-nistp384",
            "ecdh-sha2-nistp521",
            "diffie-hellman-group-exchange-sha256",
          ],
        },
      });
    });
  },
};

export { sshService };
