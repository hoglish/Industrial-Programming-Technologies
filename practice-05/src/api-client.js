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

export function buildUrl(baseUrl, path, query = {}) {
  if (typeof baseUrl !== "string" || baseUrl.trim().length === 0) throw new TypeError("baseUrl должен быть непустой строкой.");
  let parsedBase;
  try { parsedBase = new URL(baseUrl); } catch { throw new TypeError("baseUrl должен быть абсолютным URL."); }
  if (parsedBase.protocol !== "http:" && parsedBase.protocol !== "https:") throw new TypeError("baseUrl должен использовать схему http или https.");
  if (parsedBase.search) throw new TypeError("baseUrl не должен содержать query-параметры.");
  if (typeof path !== "string" || path.length === 0) throw new TypeError("path должен быть непустой строкой.");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedBase = parsedBase.toString().replace(/\/+$/, "");
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.append(key, String(value));
  }
  return searchParams.toString() 
    ? `${normalizedBase}${normalizedPath}?${searchParams.toString()}` 
    : `${normalizedBase}${normalizedPath}`;
}

export function createApiClient(options = {}) {
  const baseUrl = options.baseUrl;
  const fetchFn = Object.prototype.hasOwnProperty.call(options, "fetchFn")
    ? options.fetchFn
    : globalThis.fetch;
  const timeoutMs = options.timeoutMs ?? 2000;

  // 1. Проверка baseUrl
  if (baseUrl === undefined || baseUrl === null) throw new TypeError("baseUrl обязателен.");
  if (typeof baseUrl !== "string") throw new TypeError("baseUrl должен быть строкой.");
  if (baseUrl.trim().length === 0) throw new TypeError("baseUrl не может быть пустой строкой.");

  let normalizedBaseUrl;
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") 
      throw new TypeError(`baseUrl должен использовать http или https, получено: ${parsed.protocol}`);
    if (parsed.search)
      throw new TypeError("baseUrl не должен содержать query-параметры.");
    normalizedBaseUrl = parsed.toString().replace(/\/+$/, "");
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new TypeError(`baseUrl не является корректным URL: ${error.message}`);
  }

  // 2. Проверка fetchFn
  if (fetchFn === undefined || fetchFn === null) throw new TypeError("fetchFn обязателен.");
  if (typeof fetchFn !== "function") throw new TypeError("fetchFn должен быть функцией.");

  // 3. Проверка timeoutMs
  if (timeoutMs === undefined || timeoutMs === null) throw new TypeError("timeoutMs обязателен.");
  if (typeof timeoutMs !== "number") throw new TypeError("timeoutMs должен быть числом.");
  if (!Number.isFinite(timeoutMs)) throw new TypeError("timeoutMs должен быть конечным числом.");
  if (!Number.isInteger(timeoutMs)) throw new TypeError("timeoutMs должен быть целым числом.");
  if (timeoutMs <= 0) throw new TypeError("timeoutMs должен быть положительным числом.");

  async function requestJson(path, { query, signal, timeoutMs: overrideTimeoutMs } = {}) {
    const effectiveTimeout = overrideTimeoutMs ?? timeoutMs;
    const url = buildUrl(normalizedBaseUrl, path, query ?? {});
    const controller = new AbortController();
    const externalSignal = signal ?? null;
    
    if (externalSignal?.aborted) throw new ApiError("Запрос отменён.", { kind: "aborted", url, cause: externalSignal.reason });
    const onExternalAbort = () => controller.abort(externalSignal.reason);
    externalSignal?.addEventListener("abort", onExternalAbort);
    const timer = setTimeout(() => controller.abort(new DOMException("Timeout", "TimeoutError")), effectiveTimeout);
    
    let response;
    try {
      response = await fetchFn(url, { method: "GET", headers: { Accept: "application/json" }, signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted) {
        const reason = controller.signal.reason;
        if (reason?.name === "TimeoutError") throw new ApiError(`Превышено время ожидания запроса (${effectiveTimeout} мс).`, { kind: "timeout", url, cause: error });
        throw new ApiError("Запрос отменён.", { kind: "aborted", url, cause: reason ?? error });
      }
      throw new ApiError(`Сетевая ошибка: ${error.message}`, { kind: "network", url, cause: error });
    } finally {
      clearTimeout(timer);
      externalSignal?.removeEventListener("abort", onExternalAbort);
    }

    if (!response || typeof response !== "object" || typeof response.status !== "number" || typeof response.headers?.get !== "function") 
      throw new ApiError("fetchFn вернул некорректный Response.", { kind: "invalid-response", url });
    if (response.status === 204 || response.status === 205) return null;
    if (response.headers.get("content-length") === "0") return null;

    if (!response.ok) {
      let code = null, details = null, message = `HTTP ${response.status}`;
      try {
        const ct = response.headers.get("content-type") ?? "";
        if (ct.toLowerCase().includes("application/json")) {
          const body = await response.json();
          if (body?.error) { 
            code = body.error.code ?? null; 
            details = body.error.details ?? null; 
            if (typeof body.error.message === "string") message = body.error.message; 
          }
        }
      } catch {}
      throw new ApiError(message, { kind: "http", status: response.status, code, details, url });
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) 
      throw new ApiError(`Неожиданный Content-Type: ${contentType || "(пусто)"}.`, { kind: "invalid-response", status: response.status, url });

    let payload;
    try { payload = await response.json(); } catch (error) { 
      throw new ApiError("Ответ не является корректным JSON.", { kind: "invalid-response", status: response.status, url, cause: error }); 
    }
    return payload;
  }
  return { requestJson };
}