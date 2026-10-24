// src/api-client.js
export class ApiError extends Error {
  constructor(message, { kind, status = null, code = null, details = null, url = null, cause } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.details = details;
    this.url = url;
  }
}

const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "DELETE"]);

export function buildUrl(baseUrl, path, query = {}) {
  if (typeof baseUrl !== "string" || baseUrl.trim().length === 0) {
    throw new TypeError("baseUrl должен быть непустой строкой.");
  }
  let parsedBase;
  try {
    parsedBase = new URL(baseUrl);
  } catch {
    throw new TypeError("baseUrl должен быть абсолютным URL.");
  }
  if (parsedBase.protocol !== "http:" && parsedBase.protocol !== "https:") {
    throw new TypeError("baseUrl должен использовать схему http или https.");
  }
  if (parsedBase.search) {
    throw new TypeError("baseUrl не должен содержать query-параметры.");
  }
  if (typeof path !== "string" || path.length === 0) {
    throw new TypeError("path должен быть непустой строкой.");
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedBase = parsedBase.toString().replace(/\/+$/, "");

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.append(key, String(value));
  }
  const qs = searchParams.toString();
  return qs ? `${normalizedBase}${normalizedPath}?${qs}` : `${normalizedBase}${normalizedPath}`;
}

export function createApiClient(options = {}) {
  const baseUrl = options.baseUrl;
  const fetchFn = Object.prototype.hasOwnProperty.call(options, "fetchFn")
    ? options.fetchFn
    : globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? 2000;

  if (baseUrl === undefined || baseUrl === null) throw new TypeError("baseUrl обязателен.");
  if (typeof baseUrl !== "string") throw new TypeError("baseUrl должен быть строкой.");
  if (baseUrl.trim().length === 0) throw new TypeError("baseUrl не может быть пустой строкой.");

  let normalizedBaseUrl;
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new TypeError(`baseUrl должен использовать http или https, получено: ${parsed.protocol}`);
    }
    if (parsed.search) {
      throw new TypeError("baseUrl не должен содержать query-параметры.");
    }
    normalizedBaseUrl = parsed.toString().replace(/\/+$/, "");
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new TypeError(`baseUrl не является корректным URL: ${error.message}`);
  }

  if (fetchFn === undefined || fetchFn === null) throw new TypeError("fetchFn обязателен.");
  if (typeof fetchFn !== "function") throw new TypeError("fetchFn должен быть функцией.");

  if (timeoutMs === undefined || timeoutMs === null) throw new TypeError("timeoutMs обязателен.");
  if (typeof timeoutMs !== "number") throw new TypeError("timeoutMs должен быть числом.");
  if (!Number.isFinite(timeoutMs)) throw new TypeError("timeoutMs должен быть конечным числом.");
  if (!Number.isInteger(timeoutMs)) throw new TypeError("timeoutMs должен быть целым числом.");
  if (timeoutMs <= 0) throw new TypeError("timeoutMs должен быть положительным числом.");

  async function requestJson(path, { query, signal, timeoutMs: overrideTimeoutMs, method, body } = {}) {
    // Нормализация метода
    const rawMethod = typeof method === "string" ? method.toUpperCase() : "GET";
    if (!ALLOWED_METHODS.has(rawMethod)) {
      throw new TypeError(`Недопустимый HTTP-метод: ${method}.`);
    }

    // GET с body запрещён
    if (rawMethod === "GET" && body !== undefined && body !== null) {
      throw new TypeError("GET-запрос не может содержать тело.");
    }

    const effectiveTimeout = overrideTimeoutMs ?? timeoutMs;
    const url = buildUrl(normalizedBaseUrl, path, query ?? {});

    const controller = new AbortController();
    const externalSignal = signal ?? null;

    if (externalSignal?.aborted) {
      throw new ApiError("Запрос отменён.", { kind: "aborted", url, cause: externalSignal.reason });
    }
    const onExternalAbort = () => controller.abort(externalSignal.reason);
    externalSignal?.addEventListener("abort", onExternalAbort);
    const timer = setTimeout(
      () => controller.abort(new DOMException("Timeout", "TimeoutError")),
      effectiveTimeout,
    );

    // Формируем заголовки
    const headers = { Accept: "application/json" };
    let serializedBody;
    if (body !== undefined && body !== null) {
      headers["Content-Type"] = "application/json";
      serializedBody = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetchFn(url, {
        method: rawMethod,
        headers,
        body: serializedBody,
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        const reason = controller.signal.reason;
        if (reason?.name === "TimeoutError") {
          throw new ApiError(
            `Превышено время ожидания запроса (${effectiveTimeout} мс).`,
            { kind: "timeout", url, cause: error },
          );
        }
        throw new ApiError("Запрос отменён.", { kind: "aborted", url, cause: reason ?? error });
      }
      throw new ApiError(`Сетевая ошибка: ${error.message}`, { kind: "network", url, cause: error });
    } finally {
      clearTimeout(timer);
      externalSignal?.removeEventListener("abort", onExternalAbort);
    }

    if (
      !response ||
      typeof response !== "object" ||
      typeof response.status !== "number" ||
      typeof response.headers?.get !== "function"
    ) {
      throw new ApiError("fetchFn вернул некорректный Response.", { kind: "invalid-response", url });
    }

    // 204/205 — успешный ответ без тела
    if (response.status === 204 || response.status === 205) return null;
    if (response.headers.get("content-length") === "0") return null;

    // HTTP-ошибка важнее проверки Content-Type
    if (!response.ok) {
      let code = null;
      let details = null;
      let message = `HTTP ${response.status}`;
      try {
        const ct = response.headers.get("content-type") ?? "";
        if (ct.toLowerCase().includes("application/json")) {
          const parsed = await response.json();
          if (parsed?.error) {
            code = parsed.error.code ?? null;
            details = parsed.error.details ?? null;
            if (typeof parsed.error.message === "string") message = parsed.error.message;
          }
        }
      } catch {
        // тело не удалось разобрать — оставляем дефолтное сообщение
      }
      throw new ApiError(message, { kind: "http", status: response.status, code, details, url });
    }

    // Успешный ответ: проверяем Content-Type
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      throw new ApiError(
        `Неожиданный Content-Type: ${contentType || "(пусто)"}.`,
        { kind: "invalid-response", status: response.status, url },
      );
    }

    let payload;
    try {
      payload = await response.json();
    } catch (error) {
      throw new ApiError("Ответ не является корректным JSON.", {
        kind: "invalid-response",
        status: response.status,
        url,
        cause: error,
      });
    }
    return payload;
  }

  return { requestJson };
}