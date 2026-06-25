export function extractApiError(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object') {
    return fallback;
  }

  const httpError = error as { status?: number; error?: unknown; message?: string };

  if (httpError.status === 401) {
    return 'Sesión expirada o no autorizado. Inicia sesión como administrador.';
  }

  if (httpError.status === 0) {
    return 'No se pudo conectar con el servidor. Intenta de nuevo en unos momentos.';
  }

  const body = httpError.error;

  if (typeof body === 'string' && body.length > 0) {
    return body;
  }

  if (body && typeof body === 'object' && 'error' in body) {
    const message = (body as { error?: unknown }).error;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  if (typeof httpError.message === 'string' && httpError.message.length > 0) {
    return httpError.message;
  }

  return fallback;
}
