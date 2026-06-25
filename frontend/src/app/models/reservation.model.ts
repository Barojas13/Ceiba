import { ReservationStatus } from './enums';

export interface Reservation {
  id: string;
  eventId: string;
  quantity: number;
  buyerName: string;
  buyerEmail: string;
  status: ReservationStatus;
  reservationCode: string | null;
  createdAt: string;
  cancelledAt: string | null;
  lostTickets: number;
  eventTitle?: string | null;
  ticketPrice?: number | null;
  eventStartDate?: string | null;
}

export interface CreateReservationRequest {
  eventId: string;
  quantity: number;
}
