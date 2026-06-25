import { FormControl, FormGroup } from '@angular/forms';
import {
  endDateAfterStartValidator,
  futureDateTimeValidator,
  toApiLocalDateTime,
  toDateTimeLocalValue,
  venueCapacityValidator,
  weekendNightStartValidator
} from './event-form.validators';

describe('event-form.validators', () => {
  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-06-25T12:00:00'));
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe('futureDateTimeValidator', () => {
    const validator = futureDateTimeValidator(60);

    it('acepta fechas futuras', () => {
      const control = new FormControl('2026-06-25T14:00');
      expect(validator(control)).toBeNull();
    });

    it('rechaza fechas en el pasado o demasiado cercanas', () => {
      const control = new FormControl('2026-06-25T12:30');
      expect(validator(control)).toEqual({ futureDate: { minutesAhead: 60 } });
    });

    it('rechaza fechas inválidas', () => {
      const control = new FormControl('fecha-invalida');
      expect(validator(control)).toEqual({ invalidDate: true });
    });
  });

  describe('endDateAfterStartValidator', () => {
    it('exige que la fecha de fin sea posterior al inicio', () => {
      const group = new FormGroup({
        startDate: new FormControl('2026-06-26T10:00'),
        endDate: new FormControl('2026-06-26T09:00', {
          validators: [endDateAfterStartValidator('startDate')]
        })
      });

      const endControl = group.get('endDate')!;
      endControl.updateValueAndValidity();
      expect(endControl.errors).toEqual({ endBeforeStart: true });
    });
  });

  describe('weekendNightStartValidator', () => {
    const validator = weekendNightStartValidator();

    it('rechaza inicios en fin de semana después de las 22:00', () => {
      const control = new FormControl('2026-06-27T22:30');
      expect(validator(control)).toEqual({ weekendNight: true });
    });

    it('acepta inicios en fin de semana antes de las 22:00', () => {
      const control = new FormControl('2026-06-27T21:00');
      expect(validator(control)).toBeNull();
    });
  });

  describe('venueCapacityValidator', () => {
    const validator = venueCapacityValidator(() => 50);

    it('acepta capacidades dentro del venue', () => {
      const control = new FormControl(40);
      expect(validator(control)).toBeNull();
    });

    it('rechaza capacidades que superan el venue', () => {
      const control = new FormControl(80);
      expect(validator(control)).toEqual({ exceedsVenueCapacity: { capacity: 50 } });
    });
  });

  describe('date helpers', () => {
    it('convierte Date a valor datetime-local', () => {
      const value = toDateTimeLocalValue(new Date('2026-06-25T08:05:00'));
      expect(value).toBe('2026-06-25T08:05');
    });

    it('agrega segundos para el formato de la API', () => {
      expect(toApiLocalDateTime('2026-06-25T08:05')).toBe('2026-06-25T08:05:00');
      expect(toApiLocalDateTime('2026-06-25T08:05:30')).toBe('2026-06-25T08:05:30');
    });
  });
});
