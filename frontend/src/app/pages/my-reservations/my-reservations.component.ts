import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReservationService } from '../../services/reservation.service';
import { Reservation } from '../../models/reservation.model';
import { ReservationStatus, ReservationStatusLabels } from '../../models/enums';

@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-reservations.component.html',
  styleUrl: './my-reservations.component.scss'
})
export class MyReservationsComponent implements OnInit {
  private readonly reservationService = inject(ReservationService);

  readonly reservations = signal<Reservation[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly message = signal('');
  readonly actionLoadingId = signal<string | null>(null);

  readonly ReservationStatusLabels = ReservationStatusLabels;
  readonly ReservationStatus = ReservationStatus;

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading.set(true);
    this.error.set('');

    this.reservationService.getMyReservations().subscribe({
      next: reservations => {
        this.reservations.set(reservations);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.error?.error ?? 'No se pudieron cargar tus reservas.');
        this.loading.set(false);
      }
    });
  }

  getTotal(reservation: Reservation): number {
    return reservation.quantity * (reservation.ticketPrice ?? 0);
  }

  copyId(id: string): void {
    navigator.clipboard?.writeText(id);
    this.message.set('ID copiado al portapapeles.');
  }

  payReservation(reservation: Reservation): void {
    if (reservation.status !== ReservationStatus.PendientePago) {
      return;
    }

    this.actionLoadingId.set(reservation.id);
    this.message.set('');
    this.error.set('');

    this.reservationService.pay(reservation.id).subscribe({
      next: updated => {
        this.reservations.update(items =>
          items.map(item => (item.id === updated.id ? updated : item))
        );
        this.message.set(
          `Pago completado. Tu código de entrada es ${updated.reservationCode}. Guárdalo para el día del evento.`
        );
        this.actionLoadingId.set(null);
      },
      error: err => {
        this.error.set(err.error?.error ?? 'No se pudo completar el pago.');
        this.actionLoadingId.set(null);
      }
    });
  }

  cancelReservation(reservation: Reservation): void {
    if (reservation.status !== ReservationStatus.Confirmada) {
      return;
    }

    this.actionLoadingId.set(reservation.id);
    this.message.set('');
    this.error.set('');

    this.reservationService.cancel(reservation.id).subscribe({
      next: updated => {
        this.reservations.update(items =>
          items.map(item => (item.id === updated.id ? updated : item))
        );
        this.message.set(
          updated.lostTickets > 0
            ? 'Reserva cancelada. Algunas entradas ya no estarán disponibles.'
            : 'Reserva cancelada. Las entradas vuelven a estar disponibles.'
        );
        this.actionLoadingId.set(null);
      },
      error: err => {
        this.error.set(err.error?.error ?? 'No se pudo cancelar la reserva.');
        this.actionLoadingId.set(null);
      }
    });
  }
}
