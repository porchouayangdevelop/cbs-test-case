import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import fs from "fs/promises";

import path from "path";
class DocxExporter {
  constructor(options = {}) {
    this.options = {
      fileName:
        options.fileName ||
        `PWC Documentation batch eod from APB ${Date.now()}.docx`,
      dateFormat: options.dateFormat || "en-US",
      exportDir:
        options.exportDir || path.join(process.cwd(), "resources", "exports"),
    };

    if (!this.options.fileName.endsWith(".docx")) {
      this.options.fileName += ".docx";
    }

    this.filePath = path.join(this.options.exportDir, this.options.fileName);
  }

  async init() {
    try {
      // Ensure export directory exists
      await fs.mkdir(this.options.exportDir, { recursive: true });
      return true;
    } catch (error) {
      console.error("Error creating export directory:", error);
    }
  }

  createDocument(data) {
    console.log(data);

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: "",
              spacing: {
                before: 120,
                after: 0,
              },
            }),
            new Paragraph({
              alignment: "center",
              children: [
                new TextRun({
                  text: `PWC documentation for APB EOD at ${data.batDate}`,
                  font: "Times New Roman",
                  bold: true,
                  size: 14,
                }),
              ],
              spacing: {
                before: 200,
                after: 200,
              },
            }),
            new Paragraph({
              text: "",
              spacing: {
                before: 1440,
                after: 0,
              },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "FullName : ",
                  font: "Times New Roman",
                }),
                new TextRun({
                  text: data.FullName || "...........................",
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: "StartTime : ",
                  font: "Times New Roman",
                }),
                new TextRun({
                  text:
                    `${data.StartTime}    ` || "...........................",
                  font: "Times New Roman",
                }),
                new TextRun({
                  text: "EndTime : ",
                  font: "Times New Roman",
                }),
                new TextRun({
                  text: data.EndTime || "...........................",
                  font: "Times New Roman",
                }),
              ],
              spacing: { before: 200, after: 200 },
            }),
            // Status Tables

            this.createStatusTable(data.statuses),

            // spacing
            new Paragraph({
              text: "",
              spacing: {
                before: 1220,
                after: 0,
              },
            }),

            // signatures
            new Paragraph({
              children: [
                // new TextRun({
                //   text: "                 ",
                // }),

                new TextRun({
                  text: "Practitioner By",
                  font: "Times New Roman",
                  bold: true,
                  //   color: "#000",
                }),
                new TextRun({
                  text: "                                                                                          ",
                  font: "Times New Roman",
                }),
                new TextRun({
                  text: "Follow Up By",
                  font: "Times New Roman",
                  bold: true,
                }),
              ],
              alignment: "center",
              spacing: { before: 200, after: 200 },
            }),

            // new Paragraph({
            //   children: [
            //     new TextRun({
            //       text: "Follow Up By",
            //       font: "Times New Roman",
            //       bold: true,
            //       //   color: "#000",
            //     }),
            //   ],
            //   alignment: "right",
            //   spacing: { before: 0, after: 400 },
            // }),
          ],
        },
      ],
    });
    return doc;
  }

  createStatusTable(statuses = []) {
    const defaultStatus = [
      {
        id: 1,
        Module: "Core",
        StartTime: "",
        EndTime: "",
        Status: "",
        Remarks: "",
      },
      {
        id: 2,
        Module: "Stp",
        StartTime: "",
        EndTime: "",
        Status: "",
        Remarks: "",
      },
      {
        id: 3,
        Module: "Aml",
        StartTime: "",
        EndTime: "",
        Status: "",
        Remarks: "",
      },
      {
        id: 4,
        Module: "Report",
        StartTime: "",
        EndTime: "",
        Status: "",
        Remarks: "",
      },
    ];

    const tableData = statuses.length ? statuses : defaultStatus;

    return new Table({
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      rows: [
        // Header rows
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  text: "No",
                  alignment: "center",
                }),
              ],
              width: {
                size: 4,
                type: WidthType.PERCENTAGE,
              },
            }),
            new TableCell({
              children: [
                new Paragraph({ text: "Module", alignment: "center" }),
              ],
              width: {
                size: 8,
                type: WidthType.PERCENTAGE,
              },
            }),
            new TableCell({
              children: [new Paragraph({ text: "StartTime" })],
              width: {
                size: 14,
                type: WidthType.PERCENTAGE,
              },
            }),
            new TableCell({
              children: [new Paragraph({ text: "EndTime" })],
              width: {
                size: 14,
                type: WidthType.PERCENTAGE,
              },
            }),
            new TableCell({
              children: [
                new Paragraph({ text: "Status", alignment: "center" }),
              ],
              width: {
                size: 20,
                type: WidthType.PERCENTAGE,
              },
            }),
            new TableCell({ children: [new Paragraph({ text: "Remarks" })] }),
          ],
        }),

        // Data rows
        ...tableData.map(
          (item) =>
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      text: String(item.id),
                      alignment: "center",
                    }),
                  ],
                  width: {
                    size: 4,
                    type: WidthType.PERCENTAGE,
                  },
                }),
                new TableCell({
                  children: [new Paragraph({ text: item.Module })],
                  width: {
                    size: 8,
                    type: WidthType.PERCENTAGE,
                  },
                }),
                new TableCell({
                  children: [new Paragraph({ text: item.StartTime })],
                  width: {
                    size: 14,
                    type: WidthType.PERCENTAGE,
                  },
                }),
                new TableCell({
                  children: [new Paragraph({ text: item.EndTime })],
                  width: {
                    size: 14,
                    type: WidthType.PERCENTAGE,
                  },
                }),
                new TableCell({
                  children: [
                    new Paragraph({
                      text:
                        item.Status === "success"
                          ? "☑ Success  ☐ Error"
                          : "☐ Success  ☑ Error",
                    }),
                  ],
                  width: {
                    size: 20,
                    type: WidthType.PERCENTAGE,
                  },
                }),
                new TableCell({
                  children: [new Paragraph({ text: item.Remarks })],
                }),
              ],
            })
        ),
      ],
    });
  }

  _formatHeader(header) {
    // Convert camelCase or snake_case to Title Case
    return header
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  }

  _formatCell(value) {
    if (value === null || value === undefined) return "";
    if (value instanceof Date) {
      return value.toLocaleDateString(this.options.dateFormat);
    }
    return String(value);
  }

  _generateUniqueFilename() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const basename = path.basename(this.options.fileName, ".docx");
    return `${basename}-${timestamp}-${random}.docx`;
  }

  async exportToDocx(data) {
    try {
      // Initialize (create export directory)
      await this.init();

      // Create the document
      const doc = await this.createDocument(data);

      // Generate buffer
      const buffer = await Packer.toBuffer(doc);

      // Write file
      await fs.writeFile(this.filePath, buffer);

      // Return success with file information
      return {
        success: true,
        filePath: this.filePath,
        downloadUrl: `/download/${this.options.fileName}`,
        filename: this.options.fileName,
      };
    } catch (error) {
      console.error("Error exporting status report:", error);
      //   throw error;
    }
  }

  // Method to clean up old exports
  async cleanupOldFiles(maxAgeHours = 24) {
    try {
      const files = await fs.readdir(this.options.exportDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.options.exportDir, file);
        const stats = await fs.stat(filePath);
        const ageHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);

        if (ageHours > maxAgeHours) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error("Error cleaning up old files:", error);
    }
  }
}

export { DocxExporter };
