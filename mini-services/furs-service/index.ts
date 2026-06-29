import { createServer, IncomingMessage, ServerResponse } from "http";
import { randomBytes, createHash, createSign, generateKeyPairSync } from "crypto";
import QRCode from "qrcode";

const PORT = 3004;

interface FursConfig {
  mode: "test" | "production";
  certPath?: string;
  keyPath?: string;
  apiUrl: string;
  timeout: number;
}

const config: FursConfig = {
  mode: (process.env.FURS_MODE as "test" | "production") ?? "test",
  certPath: process.env.FURS_CERT_PATH,
  keyPath: process.env.FURS_KEY_PATH,
  apiUrl: process.env.FURS_API_URL ?? "https://blagajne-test.fu.gov.si:9002/v1/cash_registers/",
  timeout: 15000,
};

const demoKeyPair = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const computeZOI = (params: {
  taxNumber: string; issueDateTime: string; invoiceNumber: string;
  businessUnit: string; electronicDevice: string; controlSeq: number;
}): { zoi: string; md5Hash: Buffer } => {
  const input = params.taxNumber + params.issueDateTime + params.invoiceNumber +
    params.businessUnit + params.electronicDevice + String(params.controlSeq);
  const md5Hash = createHash("md5").update(input).digest();
  const zoi = base32Encode(md5Hash);
  return { zoi, md5Hash };
};

const signHash = (md5Hash: Buffer, privateKeyPem: string): Buffer => {
  const signer = createSign("SHA1");
  signer.update(md5Hash);
  signer.end();
  return signer.sign(privateKeyPem);
};

const base32Encode = (buffer: Buffer): string => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, value = 0, output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
};

const generateQrCode = async (params: {
  zoi: string; issueDateTime: string; invoiceNumber: string; taxNumber: string; total: number;
}): Promise<string> => {
  const content = params.zoi + params.issueDateTime + params.invoiceNumber + params.taxNumber + params.total.toFixed(2);
  return QRCode.toDataURL(content, { errorCorrectionLevel: "M", margin: 1, width: 200 });
};

const submitInvoice = async (invoice: any): Promise<any> => {
  if (config.mode === "production" && config.certPath && config.keyPath) {
    throw new Error("Production submission requires undici Agent — not implemented in sandbox");
  }
  const mockEor = createHash("md5")
    .update(invoice.zoi + invoice.invoiceNumber + Date.now())
    .digest("hex").toUpperCase().slice(0, 36);
  return {
    eor: mockEor, submittedAt: new Date().toISOString(),
    mode: "test", mock: true,
    message: "TEST MODE: EOR is mock-generated. Configure FURS cert + FURS_MODE=production for real submission.",
  };
};

const randomUUID = (): string => globalThis.crypto?.randomUUID?.() ?? randomBytes(16).toString("hex");

type HttpHandler = (req: IncomingMessage, res: ServerResponse, body: any) => Promise<void> | void;

const parseBody = (req: IncomingMessage): Promise<any> => new Promise((resolve, reject) => {
  let data = "";
  req.on("data", (chunk) => (data += chunk));
  req.on("end", () => { if (!data) return resolve({}); try { resolve(JSON.parse(data)); } catch { reject(new Error("Invalid JSON")); } });
  req.on("error", reject);
});

const sendJson = (res: ServerResponse, status: number, data: unknown) => {
  res.writeHead(status, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, api-key" });
  res.end(JSON.stringify(data));
};

const handleHealth = async (_req: any, res: ServerResponse) => sendJson(res, 200, { status: "ok", service: "furs-service", port: PORT, mode: config.mode, hasCert: Boolean(config.certPath && config.keyPath), timestamp: new Date().toISOString() });

const handleGenerateZoi = async (_req: any, res: ServerResponse, body: any) => {
  const required = ["taxNumber", "issueDateTime", "invoiceNumber", "businessUnit", "electronicDevice"];
  for (const field of required) { if (!body?.[field]) return sendJson(res, 400, { error: `Missing: ${field}` }); }
  try {
    const { zoi, md5Hash } = computeZOI({ taxNumber: body.taxNumber, issueDateTime: body.issueDateTime, invoiceNumber: body.invoiceNumber, businessUnit: body.businessUnit, electronicDevice: body.electronicDevice, controlSeq: body.controlSeq ?? 1 });
    const signature = signHash(md5Hash, demoKeyPair.privateKey);
    const qrCode = await generateQrCode({ zoi, issueDateTime: body.issueDateTime, invoiceNumber: body.invoiceNumber, taxNumber: body.taxNumber, total: body.total ?? 0 });
    return sendJson(res, 200, { zoi, qrCode, signatureLength: signature.length });
  } catch (err) { return sendJson(res, 500, { error: "ZOI generation failed", detail: err instanceof Error ? err.message : "Unknown" }); }
};

const handleSubmitInvoice = async (_req: any, res: ServerResponse, body: any) => {
  if (!body?.zoi) return sendJson(res, 400, { error: "Missing: zoi" });
  try { const result = await submitInvoice(body); return sendJson(res, 200, result); }
  catch (err) { return sendJson(res, 500, { error: "Submission failed", detail: err instanceof Error ? err.message : "Unknown" }); }
};

const routes: Record<string, Record<string, HttpHandler>> = {
  "/api/furs/health": { GET: handleHealth },
  "/api/furs/generate-zoi": { POST: handleGenerateZoi },
  "/api/furs/submit-invoice": { POST: handleSubmitInvoice },
};

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, api-key" }); return res.end(); }
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const route = routes[url.pathname];
  if (!route) return sendJson(res, 404, { error: "Not found", path: url.pathname });
  const handler = route[req.method ?? "GET"];
  if (!handler) return sendJson(res, 405, { error: "Method not allowed" });
  try { const body = req.method === "POST" ? await parseBody(req) : {}; await handler(req, res, body); }
  catch (err) { sendJson(res, 500, { error: "Internal server error", detail: err instanceof Error ? err.message : "Unknown" }); }
});

server.listen(PORT, () => {
  console.log(`[furs-service] Running on port ${PORT}`);
  console.log(`[furs-service] Mode: ${config.mode}`);
  console.log(`[furs-service] Cert configured: ${Boolean(config.certPath && config.keyPath)}`);
  if (config.mode === "test") console.warn("[furs-service] ⚠️  TEST MODE — Set FURS_MODE=production + FURS_CERT_PATH + FURS_KEY_PATH for real FURS submission.");
});

process.on("SIGTERM", () => { server.close(() => process.exit(0)); });
process.on("SIGINT", () => { server.close(() => process.exit(0)); });
process.on("uncaughtException", (err: Error) => console.error("[furs-service] UNCAUGHT:", err));
process.on("unhandledRejection", (reason: unknown) => console.error("[furs-service] UNHANDLED:", reason));
