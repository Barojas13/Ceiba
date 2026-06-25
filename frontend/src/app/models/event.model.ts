import { EventStatus, EventType } from './enums';

export interface Event {
  id: string;
  title: string;
  description: string;
  venueId: number;
  venueName: string;
  maxCapacity: number;
  startDate: string;
  endDate: string;
  ticketPrice: number;
  type: EventType;
  status: EventStatus;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  venueId: number;
  maxCapacity: number;
  startDate: string;
  endDate: string;
  ticketPrice: number;
  type: EventType;
}

export interface EventFilter {
  type?: EventType;
  venueId?: number;
  status?: EventStatus;
  startDateFrom?: string;
  startDateTo?: string;
  titleSearch?: string;
}

export interface CancelledReservationSummary {
  id: string;
  buyerName: string;
  quantity: number;
  cancelledAt: string | null;
  lostTickets: number;
}

export interface OccupancyReport {
  eventId: string;
  eventTitle: string;
  totalSoldTickets: number;
  pendingTickets: number;
  lostTickets: number;
  availableTickets: number;
  occupancyPercentage: number;
  totalRevenue: number;
  status: EventStatus;
  cancelledReservations: CancelledReservationSummary[];
}
