"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWebhook = exports.loadWebhookConfig = void 0;
// Веб-хук уведомлений CLI: чтение конфигурации из .env, fire-and-forget POST с коротким таймаутом.
// Без .env/MDLINT_WEBHOOK_URL — тихий no-op (см. .env.example). Применяется только в bin/lint-markdown.cjs.
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const envPath = path_1.default.join(__dirname, ".env"); // notify.js собирается в корень репозитория
const TIMEOUT_MS = 2000;
const parseEnvLine = (raw) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) {
        return null;
    }
    const eq = line.indexOf("=");
    if (eq === -1) {
        return null;
    }
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    const quoted = (value.startsWith("\"") && value.endsWith("\"")) ||
        (value.startsWith("'") && value.endsWith("'"));
    if (quoted) {
        value = value.slice(1, -1);
    }
    return { key, value };
};
const loadEnvFile = () => {
    if (!fs_1.default.existsSync(envPath)) {
        return;
    }
    const lines = fs_1.default.readFileSync(envPath, "utf8").split("\n");
    for (const raw of lines) {
        const parsed = parseEnvLine(raw);
        if (parsed && !(parsed.key in process.env)) {
            process.env[parsed.key] = parsed.value; // приоритет — у уже заданных
        }
    }
};
const loadWebhookConfig = () => {
    loadEnvFile();
    const url = (process.env.MDLINT_WEBHOOK_URL || "").trim();
    if (!url) {
        return null;
    }
    const tok = (process.env.MDLINT_WEBHOOK_TOK || "").trim();
    return { url, tok };
};
exports.loadWebhookConfig = loadWebhookConfig;
const sendWebhook = async (text) => {
    const cfg = (0, exports.loadWebhookConfig)();
    if (!cfg) {
        return false;
    }
    if (!cfg.url.startsWith("https://")) {
        return false; // без TLS токен не отправляем
    }
    const headers = { "Content-Type": "application/json" };
    if (cfg.tok) {
        headers.Authorization = `Bearer ${cfg.tok}`;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        await fetch(cfg.url, {
            method: "POST",
            headers,
            body: JSON.stringify({ text }),
            signal: controller.signal
        });
        return true;
    }
    catch {
        return false; // fire-and-forget: не роняем прогон
    }
    finally {
        clearTimeout(timer);
    }
};
exports.sendWebhook = sendWebhook;
