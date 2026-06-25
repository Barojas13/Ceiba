import { FormControl } from '@angular/forms';
import { formatPriceInput, parsePriceInput, priceValidator } from './price-format.util';

describe('price-format.util', () => {
  describe('parsePriceInput', () => {
    it('parsea números y cadenas con formato colombiano', () => {
      expect(parsePriceInput(1200)).toBe(1200);
      expect(parsePriceInput('1.200,50')).toBe(1200.5);
      expect(parsePriceInput('$ 99.99')).toBe(99.99);
    });

    it('devuelve null para valores inválidos', () => {
      expect(parsePriceInput('')).toBeNull();
      expect(parsePriceInput('abc')).toBeNull();
    });
  });

  describe('formatPriceInput', () => {
    it('formatea montos con dos decimales', () => {
      expect(formatPriceInput(1500)).toBe('1,500.00');
      expect(formatPriceInput('2500.5')).toBe('2,500.50');
    });

    it('devuelve cadena vacía sin valor', () => {
      expect(formatPriceInput(null)).toBe('');
    });
  });

  describe('priceValidator', () => {
    const validator = priceValidator();

    it('acepta precios positivos', () => {
      const control = new FormControl('120.50');
      expect(validator(control)).toBeNull();
    });

    it('rechaza precios no numéricos', () => {
      const control = new FormControl('gratis');
      expect(validator(control)).toEqual({ invalidPrice: true });
    });

    it('rechaza precios menores o iguales a cero', () => {
      const control = new FormControl('0');
      expect(validator(control)?.['min']).toBeDefined();
    });
  });
});
