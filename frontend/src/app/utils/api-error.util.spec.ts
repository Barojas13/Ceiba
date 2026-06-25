import { extractApiError } from './api-error.util';

describe('api-error.util', () => {
  it('devuelve mensaje para sesión no autorizada', () => {
    const message = extractApiError({ status: 401 }, 'Error');
    expect(message).toContain('Sesión expirada');
  });

  it('devuelve mensaje cuando no hay conexión con el servidor', () => {
    const message = extractApiError({ status: 0 }, 'Error');
    expect(message).toContain('No se pudo conectar');
  });

  it('extrae mensaje de error en texto plano', () => {
    const message = extractApiError({ error: 'Usuario no encontrado' }, 'Error');
    expect(message).toBe('Usuario no encontrado');
  });

  it('extrae mensaje de error en objeto JSON', () => {
    const message = extractApiError({ error: { error: 'Correo ya registrado' } }, 'Error');
    expect(message).toBe('Correo ya registrado');
  });

  it('usa el fallback cuando no hay detalle útil', () => {
    const message = extractApiError({}, 'No fue posible completar la acción');
    expect(message).toBe('No fue posible completar la acción');
  });
});
