import { exec } from "child_process";
import express from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { XMLValidator } from "fast-xml-parser";
import { OpenAPIV3 } from "openapi-types";
import Oas from "oas";
import reducer from "oas/reducer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

const tempDir = path.resolve(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

app.use(express.json());

app.post("/api/convert-to-openapi", async (req: Request, res: Response): Promise<void> => {

  let { xmlData } = req.body;
  const { url } = req.body;

  if (url) {
    try {
      const response = await fetch(url);
      xmlData = await response.text();
    } catch {
      res.status(500).json({ error: "Failed to fetch XML from URL" });
      return;
    }
  }

  // Validate XML
  const result = XMLValidator.validate(xmlData);
  if (result !== true) {
    res.status(400).json({ error: "Invalid XML format" });
    return;
  }

  const customHeadersRaw = req.headers["custom-headers"];
  let customHeaders: Record<string, string> | undefined = undefined;
  if (typeof customHeadersRaw === "string") {
    customHeaders = JSON.parse(customHeadersRaw);
  }

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
      res.status(500).json({ error: JSON.stringify(error || stderr).toString() });
      return;
    }

    const openApi = fs.readFileSync(openapiPath, "utf8");
    if (!openApi) {
      res.status(500).json({ error: "Failed to read OpenAPI file" });
      return;
    }

    const openApiJson: OpenAPIV3.Document = JSON.parse(openApi);

    if (!customHeaders) {
      res.json({
        xmlData: JSON.stringify(xmlData),
        openapi: openApi,
      });
      return;
    }

    for (const [, pathValue] of Object.entries(openApiJson.paths)) {
      // Each `pathValue` represents the details of a specific API path (e.g., `/users`, `/orders`).
      if (!pathValue) continue;
      if (!pathValue.parameters) {
        pathValue.parameters = [];
      }

      for (const [key, value] of Object.entries(customHeaders)) {
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

app.post("/api/process-openapi", async (req: Request, res: Response): Promise<void> => {
  try {
    const { selectedOperations } = req.body as {
      selectedOperations?: Record<string, string[]>;
    };

    const openApi = fs.readFileSync(path.join(__dirname, "temp/openapi.json"), "utf8");
    if (!openApi) {
      res.status(500).json({ error: "Failed to read OpenAPI file" });
      return;
    }

    const openApiJson: OpenAPIV3.Document = JSON.parse(openApi);

    const oasInput = openApiJson as OpenAPIV3.Document & Record<string, unknown>;
    const oas = new Oas(oasInput);
    await oas.dereference();

    const dereferencedOpenApi = oas.api as OpenAPIV3.Document;
    let processedOpenApi: OpenAPIV3.Document;
    if (!selectedOperations) {
      // No filter sent → return full document
      processedOpenApi = dereferencedOpenApi;
    } else if (Object.keys(selectedOperations).length === 0) {
      // Empty selection → return document with no paths
      processedOpenApi = { ...dereferencedOpenApi, paths: {} };
    } else {
      processedOpenApi = reducer(dereferencedOpenApi as unknown as Parameters<typeof reducer>[0], { paths: selectedOperations }) as OpenAPIV3.Document;
    }

    res.json({ openapi: processedOpenApi });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

app.listen(port, "0.0.0.0", () => {
    console.log("Listening on port:", port);
});
