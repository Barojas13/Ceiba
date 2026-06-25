import { Event } from '../models/event.model';
import { EventStatus } from '../models/enums';

export const BUSINESS_RULES = {
  HIGH_PRICE_THRESHOLD: 100,
  MAX_TICKETS_HIGH_PRICE: 10,
  MAX_TICKETS_LAST_24H: 5,
  MIN_HOURS_BEFORE_RESERVE: 1,
  HOURS_24: 24,
  PENALTY_HOURS_BEFORE_EVENT: 48,
  WEEKEND_NIGHT_CUTOFF_HOUR: 22
} as const;

export function parseEventDate(value: string): Date {
  return new Date(value);
}

export function getHoursUntilEvent(startDate: string): number {
  const start = parseEventDate(startDate).getTime();
  return (start - Date.now()) / (1000 * 60 * 60);
}

export function canReserveEvent(event: Event): { allowed: boolean; reason: string } {
  if (event.status === EventStatus.Completado) {
    return {
      allowed: false,
      reason: 'Este evento ya terminó y ya no admite reservas.'
    };
  }

  if (event.status === EventStatus.Cancelado) {
    return {
      allowed: false,
      reason: 'Este evento fue cancelado y no admite reservas.'
    };
  }

  const hoursUntilStart = getHoursUntilEvent(event.startDate);

  if (hoursUntilStart < BUSINESS_RULES.MIN_HOURS_BEFORE_RESERVE) {
    return {
      allowed: false,
      reason: 'El evento empieza en menos de 1 hora. Ya no es posible reservar.'
    };
  }

  return { allowed: true, reason: '' };
}

export function getMaxTicketsPerTransaction(event: Event): number {
  const hoursUntilStart = getHoursUntilEvent(event.startDate);

  if (hoursUntilStart < BUSINESS_RULES.HOURS_24) {
    return BUSINESS_RULES.MAX_TICKETS_LAST_24H;
  }

  if (event.ticketPrice > BUSINESS_RULES.HIGH_PRICE_THRESHOLD) {
    return BUSINESS_RULES.MAX_TICKETS_HIGH_PRICE;
  }

  return event.maxCapacity;
}

export function getQuantityRuleHint(event: Event): string {
  const hoursUntilStart = getHoursUntilEvent(event.startDate);

  if (hoursUntilStart < BUSINESS_RULES.HOURS_24) {
    return `Como el evento empieza pronto, puedes reservar hasta ${BUSINESS_RULES.MAX_TICKETS_LAST_24H} entradas por compra.`;
  }

  if (event.ticketPrice > BUSINESS_RULES.HIGH_PRICE_THRESHOLD) {
    return `Puedes reservar hasta ${BUSINESS_RULES.MAX_TICKETS_HIGH_PRICE} entradas por compra en este evento.`;
  }

  return `Puedes reservar hasta ${event.maxCapacity} entradas.`;
}

export function getQuantityLimitMessage(event: Event, max: number): string {
  const hoursUntilStart = getHoursUntilEvent(event.startDate);

  if (hoursUntilStart < BUSINESS_RULES.HOURS_24) {
    return `Solo puedes reservar hasta ${max} entradas porque el evento empieza en menos de 24 horas.`;
  }

  if (event.ticketPrice > BUSINESS_RULES.HIGH_PRICE_THRESHOLD) {
    return `Solo puedes reservar hasta ${max} entradas por compra en este evento.`;
  }

  return `Solo puedes reservar hasta ${max} entradas en esta compra.`;
}

export function hasCancelPenalty(event: Event): boolean {
  return getHoursUntilEvent(event.startDate) < BUSINESS_RULES.PENALTY_HOURS_BEFORE_EVENT;
}

export function getCancelPenaltyHint(event: Event): string {
  if (!hasCancelPenalty(event)) {
    return 'Si cancelas con más de 48 horas de anticipación, las entradas vuelven a estar disponibles.';
  }

  return 'Faltan menos de 48 horas para el evento. Si cancelas, esas entradas no volverán a estar disponibles.';
}
