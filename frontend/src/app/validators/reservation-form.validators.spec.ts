import { FormControl, FormGroup } from '@angular/forms';
import { Event } from '../models/event.model';
import { EventStatus, EventType } from '../models/enums';
import { reservationQuantityValidator } from './reservation-form.validators';

function createEvent(overrides: Partial<Event> = {}): Event {
  const now = Date.now();
  return {
    id: 'evt-1',
    title: 'Evento',
    description: 'Descripción',
    venueId: 1,
    venueName: 'Sala',
    maxCapacity: 100,
    startDate: new Date(now + 48 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(now + 50 * 60 * 60 * 1000).toISOString(),
    ticketPrice: 50,
    type: EventType.Conferencia,
    status: EventStatus.Activo,
    ...overrides
  };
}

describe('reservation-form.validators', () => {
  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-06-25T12:00:00'));
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('no valida cuando no hay evento seleccionado', () => {
    const control = new FormControl(3);
    const validator = reservationQuantityValidator(() => undefined);
    expect(validator(control)).toBeNull();
  });

  it('acepta cantidades dentro del límite permitido', () => {
    const event = createEvent({ maxCapacity: 100, ticketPrice: 50 });
    const control = new FormControl(5);
    const validator = reservationQuantityValidator(() => event);
    expect(validator(control)).toBeNull();
  });

  it('rechaza cantidades que superan el límite por precio alto', () => {
    const event = createEvent({ ticketPrice: 200, maxCapacity: 100 });
    const control = new FormControl(15);
    const validator = reservationQuantityValidator(() => event);
    expect(validator(control)).toEqual({ maxTicketsPerTransaction: { max: 10 } });
  });

  it('rechaza cantidades que superan el límite de últimas 24 horas', () => {
    const event = createEvent({
      startDate: '2026-06-25T20:00:00',
      endDate: '2026-06-25T22:00:00',
      ticketPrice: 50,
      maxCapacity: 100
    });
    const control = new FormControl(8);
    const validator = reservationQuantityValidator(() => event);
    expect(validator(control)).toEqual({ maxTicketsPerTransaction: { max: 5 } });
  });
});
