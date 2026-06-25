import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CreateReservationRequest, Reservation } from '../models/reservation.model';

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly baseUrl = `${environment.apiUrl}/reservations`;

  constructor(private readonly http: HttpClient) {}

  create(request: CreateReservationRequest) {
    return this.http.post<Reservation>(this.baseUrl, request);
  }

  getMyReservations() {
    return this.http.get<Reservation[]>(`${this.baseUrl}/me`);
  }

  getById(id: string) {
    return this.http.get<Reservation>(`${this.baseUrl}/${id}`);
  }

  confirmPayment(id: string) {
    return this.http.post<Reservation>(`${this.baseUrl}/${id}/confirm-payment`, {});
  }

  pay(id: string) {
    return this.http.post<Reservation>(`${this.baseUrl}/${id}/pay`, {});
  }

  cancel(id: string) {
    return this.http.post<Reservation>(`${this.baseUrl}/${id}/cancel`, {});
  }
}
