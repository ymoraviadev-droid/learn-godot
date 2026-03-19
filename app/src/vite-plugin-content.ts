import type { Plugin } from "vite";
import fs from "fs";
import path from "path";

const CONTENT_DIR = path.resolve(__dirname, "../content");
const IMAGES_DIR = path.join(CONTENT_DIR, "images");
const CHAPTERS_DIR = path.join(CONTENT_DIR, "chapters");

export function contentPlugin(): Plugin {
  return {
    name: "content-plugin",
    configureServer(server) {
      // POST /api/upload-image — save image file to content/images/
      server.middlewares.use("/api/upload-image", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => {
          try {
            const body = Buffer.concat(chunks);
            const boundary = req.headers["content-type"]
              ?.split("boundary=")[1];

            if (!boundary) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Missing boundary" }));
              return;
            }

            const { filename, fileData } = parseMultipart(body, boundary);
            if (!filename || !fileData) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "No file found" }));
              return;
            }

            // Sanitize filename
            const safeName = sanitizeFilename(filename);
            const destPath = path.join(IMAGES_DIR, safeName);

            // Ensure unique filename
            const finalPath = getUniquePath(destPath);
            const finalName = path.basename(finalPath);

            fs.mkdirSync(IMAGES_DIR, { recursive: true });
            fs.writeFileSync(finalPath, fileData);

            const imageUrl = `/content/images/${finalName}`;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ url: imageUrl, filename: finalName }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
        });
      });

      // POST /api/save-content — save meta.json + per-chapter JSON files
      server.middlewares.use("/api/save-content", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }

        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => {
          try {
            const { meta, chapters } = JSON.parse(
              Buffer.concat(chunks).toString("utf-8")
            );

            fs.mkdirSync(CHAPTERS_DIR, { recursive: true });

            // Write meta.json
            fs.writeFileSync(
              path.join(CHAPTERS_DIR, "meta.json"),
              JSON.stringify(meta, null, 2),
              "utf-8"
            );

            // Write individual chapter files
            const keepFiles = new Set<string>(["meta.json"]);
            for (const chapter of chapters) {
              const filename = `${chapter.id}.json`;
              keepFiles.add(filename);
              fs.writeFileSync(
                path.join(CHAPTERS_DIR, filename),
                JSON.stringify(chapter, null, 2),
                "utf-8"
              );
            }

            // Remove stale chapter files (deleted chapters + old monolith)
            for (const file of fs.readdirSync(CHAPTERS_DIR)) {
              if (file.endsWith(".json") && !keepFiles.has(file)) {
                fs.unlinkSync(path.join(CHAPTERS_DIR, file));
              }
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
        });
      });

      // GET /api/list-images — return image metadata
      server.middlewares.use("/api/list-images", (req, res, next) => {
        if (req.method !== "GET") return next();
        try {
          if (!fs.existsSync(IMAGES_DIR)) {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify([]));
            return;
          }
          const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);
          const images = fs.readdirSync(IMAGES_DIR)
            .filter((f) => IMAGE_EXTS.has(path.extname(f).toLowerCase()))
            .map((filename) => {
              const stat = fs.statSync(path.join(IMAGES_DIR, filename));
              return {
                filename,
                url: `/content/images/${encodeURIComponent(filename)}`,
                sizeBytes: stat.size,
                modifiedAt: stat.mtime.toISOString(),
              };
            })
            .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt));
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(images));
        } catch (err) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });

      // POST /api/delete-image — delete an image file
      server.middlewares.use("/api/delete-image", (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.end("Method not allowed");
          return;
        }
        const chunks: Buffer[] = [];
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => {
          try {
            const { filename } = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
            if (!filename || filename.includes("/") || filename.includes("..")) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: "Invalid filename" }));
              return;
            }
            const filePath = path.join(IMAGES_DIR, filename);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok: true }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
        });
      });

      // Serve content/chapters/ as static files (no caching)
      server.middlewares.use("/content/chapters", (req, res, next) => {
        if (req.method !== "GET") return next();
        const filePath = path.join(CHAPTERS_DIR, decodeURIComponent(req.url || ""));
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });

      // Serve content/images/ as static files
      server.middlewares.use("/content/images", (req, res, next) => {
        if (req.method !== "GET") return next();
        const filePath = path.join(IMAGES_DIR, decodeURIComponent(req.url || ""));
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes: Record<string, string> = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".webp": "image/webp",
            ".svg": "image/svg+xml",
          };
          res.setHeader(
            "Content-Type",
            mimeTypes[ext] || "application/octet-stream"
          );
          fs.createReadStream(filePath).pipe(res);
        } else {
          next();
        }
      });
    },
  };
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getUniquePath(filePath: string): string {
  if (!fs.existsSync(filePath)) return filePath;
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  const dir = path.dirname(filePath);
  let counter = 1;
  let candidate: string;
  do {
    candidate = path.join(dir, `${base}_${counter}${ext}`);
    counter++;
  } while (fs.existsSync(candidate));
  return candidate;
}

function parseMultipart(
  body: Buffer,
  boundary: string
): { filename: string | null; fileData: Buffer | null } {
  const boundaryBuf = Buffer.from(`--${boundary}`);
  const parts = splitBuffer(body, boundaryBuf);

  for (const part of parts) {
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;

    const headers = part.subarray(0, headerEnd).toString("utf-8");
    const filenameMatch = headers.match(/filename="([^"]+)"/);
    if (!filenameMatch) continue;

    // File data starts after \r\n\r\n and ends before trailing \r\n
    let fileData = part.subarray(headerEnd + 4);
    if (fileData[fileData.length - 2] === 0x0d && fileData[fileData.length - 1] === 0x0a) {
      fileData = fileData.subarray(0, fileData.length - 2);
    }

    return { filename: filenameMatch[1], fileData };
  }

  return { filename: null, fileData: null };
}

function splitBuffer(buf: Buffer, delimiter: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;
  while (start < buf.length) {
    const idx = buf.indexOf(delimiter, start);
    if (idx === -1) {
      parts.push(buf.subarray(start));
      break;
    }
    if (idx > start) {
      parts.push(buf.subarray(start, idx));
    }
    start = idx + delimiter.length;
  }
  return parts;
}
