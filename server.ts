import { exec } from "child_process";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { XMLValidator } from "fast-xml-parser";
import { OpenAPIV3 } from "openapi-types";
import Oas from "oas";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const tempDir = path.resolve(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

app.use(express.json());

app.post("/convert-to-openapi", async (req, res) => {
  let { xmlData } = req.body;
  const { url } = req.body;

  if (url) {
    try {
      const response = await fetch(url);
      const text = await response.text();
      xmlData = text;
    } catch {
      return res.status(500).json({ error: "Failed to fetch XML from URL" });
    }
  }

  // Validate XML
  const result = XMLValidator.validate(xmlData);
  if (result !== true) {
    return res.status(400).json({ error: "Invalid XML format" });
  }

  const customHeaders = JSON.parse(req.headers["custom-headers"]);

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  } else {
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      fs.unlink(filePath, () => {});
    }
  }

  const metadataPath = path.join(tempDir, `metadata-${Date.now()}.xml`);
  const openapiPath = path.join(tempDir, `openapi.json`);
  fs.writeFileSync(metadataPath, xmlData);

  const command = `odata-openapi3 --target "${openapiPath}" "${metadataPath}"`;
  exec(command, (error, stdout, stderr) => {
    if (error || stderr) {
      return res.status(500).json({ error: (error || stderr).toString() });
    }
    const openApi = fs.readFileSync(openapiPath, "utf8");
    if (!openApi) {
      return res.status(500).json({ error: "Failed to read OpenAPI file" });
    }

    const openApiJson: OpenAPIV3.Document = JSON.parse(openApi);

    if (!customHeaders) {
      return res.json({
        xmlData: JSON.stringify(xmlData),
        openapi: openApi,
      });
    }
    const parsedHeaders = JSON.parse(customHeaders);

    for (const [, pathValue] of Object.entries(openApiJson.paths)) {
      // Each `pathValue` represents the details of a specific API path (e.g., `/users`, `/orders`).
      if (!pathValue) continue;
      if (!pathValue.parameters) {
        pathValue.parameters = [];
      }

      for (const [key, value] of Object.entries(parsedHeaders)) {
        // Add each header as a parameter to the current path's `parameters` array.
        pathValue.parameters.push({
          in: "header",
          name: key,
          schema: {
            type: "string",
            default: value,
          },
        });
      }
    }

    res.json({
      xmlData: JSON.stringify(xmlData),
      openapi: JSON.stringify(openApiJson),
    });
  });
});

app.post("/process-openapi", async (req, res) => {
  try {
    const openApi = fs.readFileSync("temp/openApi.json", "utf8");
    if (!openApi) {
      return res.status(500).json({ error: "Failed to read OpenAPI file" });
    }

    const openApiJson = JSON.parse(openApi);

    const oas = new Oas(openApiJson);
    await oas.dereference();

    res.json(JSON.stringify({ dereferencedData: oas }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const server = app.listen(0, () => {
  console.log("Listening on port:", server.address().port);

  // Write the port to a file
  fs.writeFileSync(
    path.resolve(__dirname, "backend-port.txt"),
    server.address().port.toString(),
  );
});
