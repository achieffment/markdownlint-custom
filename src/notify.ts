// Веб-хук уведомлений CLI: чтение конфигурации из .env, fire-and-forget POST с коротким таймаутом.
// Без .env/MDLINT_WEBHOOK_URL — тихий no-op (см. .env.example). Применяется только в bin/lint-markdown.cjs.
import fs from "fs";
import path from "path";

const envPath = path.join(__dirname, ".env");                      // notify.js собирается в корень репозитория
const TIMEOUT_MS = 2000;

interface WebhookConfig {
    url: string;
    tok: string;
}

const parseEnvLine = (raw: string): { key: string; value: string } | null => {
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

const loadEnvFile = (): void => {
    if (!fs.existsSync(envPath)) {
        return;
    }
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const raw of lines) {
        const parsed = parseEnvLine(raw);
        if (parsed && !(parsed.key in process.env)) {
            process.env[parsed.key] = parsed.value;                // приоритет — у уже заданных
        }
    }
};

export const loadWebhookConfig = (): WebhookConfig | null => {
    loadEnvFile();
    const url = (process.env.MDLINT_WEBHOOK_URL || "").trim();
    if (!url) {
        return null;
    }
    const tok = (process.env.MDLINT_WEBHOOK_TOK || "").trim();
    return { url, tok };
};

export const sendWebhook = async (text: string): Promise<boolean> => {
    const cfg = loadWebhookConfig();
    if (!cfg) {
        return false;
    }
    if (!cfg.url.startsWith("https://")) {
        return false;                                            // без TLS токен не отправляем
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
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
    } catch {
        return false;                                            // fire-and-forget: не роняем прогон
    } finally {
        clearTimeout(timer);
    }
};
