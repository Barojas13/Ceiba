import { Event } from '../models/event.model';
import { EventStatus, EventType } from '../models/enums';
import {
  BUSINESS_RULES,
  canReserveEvent,
  getCancelPenaltyHint,
  getMaxTicketsPerTransaction,
  getQuantityLimitMessage,
  getQuantityRuleHint,
  hasCancelPenalty
} from './business-rules.util';

function createEvent(overrides: Partial<Event> = {}): Event {
  const now = Date.now();
  return {
    id: 'evt-1',
    title: 'Evento de prueba',
    description: 'Descripción',
    venueId: 1,
    venueName: 'Auditorio Central',
    maxCapacity: 100,
    startDate: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(now + 50 * 60 * 60 * 1000).toISOString(),
    ticketPrice: 50,
    type: EventType.Conferencia,
    status: EventStatus.Activo,
    ...overrides
  };
}

describe('business-rules.util', () => {
  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-06-25T12:00:00'));
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  describe('canReserveEvent', () => {
    it('rechaza eventos completados', () => {
      const result = canReserveEvent(createEvent({ status: EventStatus.Completado }));
      expect(result.allowed).toBeFalse();
      expect(result.reason).toContain('ya terminó');
    });

    it('rechaza eventos cancelados', () => {
      const result = canReserveEvent(createEvent({ status: EventStatus.Cancelado }));
      expect(result.allowed).toBeFalse();
      expect(result.reason).toContain('cancelado');
    });

    it('rechaza reservas con menos de 1 hora antes del inicio', () => {
      const result = canReserveEvent(
        createEvent({ startDate: '2026-06-25T12:30:00', endDate: '2026-06-25T14:00:00' })
      );
      expect(result.allowed).toBeFalse();
      expect(result.reason).toContain('menos de 1 hora');
    });

    it('permite reservar eventos activos con más de 1 hora de anticipación', () => {
      const result = canReserveEvent(createEvent());
      expect(result.allowed).toBeTrue();
      expect(result.reason).toBe('');
    });
  });

  describe('getMaxTicketsPerTransaction', () => {
    it('limita a 5 entradas si faltan menos de 24 horas', () => {
      const event = createEvent({
        startDate: '2026-06-25T20:00:00',
        endDate: '2026-06-25T22:00:00',
        maxCapacity: 100,
        ticketPrice: 50
      });
      expect(getMaxTicketsPerTransaction(event)).toBe(BUSINESS_RULES.MAX_TICKETS_LAST_24H);
    });

    it('limita a 10 entradas en eventos de precio alto', () => {
      const event = createEvent({ ticketPrice: 150, maxCapacity: 100 });
      expect(getMaxTicketsPerTransaction(event)).toBe(BUSINESS_RULES.MAX_TICKETS_HIGH_PRICE);
    });

    it('usa la capacidad del evento cuando no aplican otras reglas', () => {
      const event = createEvent({ maxCapacity: 80, ticketPrice: 50 });
      expect(getMaxTicketsPerTransaction(event)).toBe(80);
    });
  });

  describe('getQuantityRuleHint', () => {
    it('informa el límite de últimas 24 horas', () => {
      const event = createEvent({
        startDate: '2026-06-25T20:00:00',
        endDate: '2026-06-25T22:00:00'
      });
      expect(getQuantityRuleHint(event)).toContain('5 entradas');
    });
  });

  describe('getQuantityLimitMessage', () => {
    it('informa el límite por precio alto', () => {
      const event = createEvent({ ticketPrice: 200 });
      expect(getQuantityLimitMessage(event, 10)).toContain('10 entradas');
    });
  });

  describe('cancel penalty', () => {
    it('aplica penalización con menos de 48 horas', () => {
      const event = createEvent({
        startDate: '2026-06-26T10:00:00',
        endDate: '2026-06-26T12:00:00'
      });
      expect(hasCancelPenalty(event)).toBeTrue();
      expect(getCancelPenaltyHint(event)).toContain('no volverán a estar disponibles');
    });

    it('no aplica penalización con más de 48 horas', () => {
      const event = createEvent();
      expect(hasCancelPenalty(event)).toBeFalse();
      expect(getCancelPenaltyHint(event)).toContain('vuelven a estar disponibles');
    });
  });
});
