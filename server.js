import { exec } from "child_process";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const tempDir = path.resolve(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

app.use(express.json());

app.post("/convert-to-openapi", (req, res) => {
  const { xmlData } = req.body;
  console.log(req.body);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  } else {
    fs.readdir(tempDir, (err, files) => {
      if (err || files.length === 0) {
        return;
      }

      for (const file of files) {
        const filePath = path.join(tempDir, file);
        fs.unlink(filePath, () => {});
      }
    });
  }

  const metadataPath = path.join(tempDir, `metadata-${Date.now()}.xml`);
  const openapiPath = path.join(tempDir, `ZCRM_ODATA_SRV-${Date.now()}.json`);

  fs.writeFile(metadataPath, xmlData, (err) => {
    if (err) {
      return res.status(500).json({ error: "Failed to save metadata file" });
    }

    const command = `odata-openapi3 --target "${openapiPath}" "${metadataPath}"`;
    exec(command, (error, stdout, stderr) => {
      if (error || stderr) {
        return res.status(500).json({ error: (error || stderr).toString() });
      }

      fs.readFile(openapiPath, "utf8", (readErr, data) => {
        if (readErr) {
          return res.status(500).json({ error: "Failed to read OpenAPI file" });
        }

        res.json({ openapi: data });
      });
    });
  });
});

const server = app.listen(0, () => {
  console.log("Listening on port:", server.address().port);

  // Write the port to a file
  fs.writeFileSync(path.resolve(__dirname, "backend-port.txt"), server.address().port.toString());
});
