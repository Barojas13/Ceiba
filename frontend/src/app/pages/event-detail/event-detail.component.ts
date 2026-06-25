import { Component, ElementRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { ReservationService } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';
import { Event, OccupancyReport } from '../../models/event.model';
import { Reservation } from '../../models/reservation.model';
import {
  EventStatus,
  EventStatusLabels,
  EventTypeLabels,
  ReservationStatus,
  ReservationStatusLabels
} from '../../models/enums';
import {
  canReserveEvent,
  getCancelPenaltyHint,
  getMaxTicketsPerTransaction,
  getQuantityRuleHint,
  getQuantityLimitMessage,
  hasCancelPenalty
} from '../../utils/business-rules.util';
import { reservationQuantityValidator } from '../../validators/reservation-form.validators';

interface PageNotification {
  type: 'success' | 'error';
  title: string;
  details: string[];
}

interface ReserveConfirmation {
  reservation: Reservation;
  quantity: number;
  total: number;
  buyerName: string;
}

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './event-detail.component.html',
  styleUrl: './event-detail.component.scss'
})
export class EventDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly eventService = inject(EventService);
  private readonly reservationService = inject(ReservationService);
  readonly authService = inject(AuthService);

  private readonly notificationAnchor = viewChild<ElementRef<HTMLElement>>('notificationAnchor');

  readonly event = signal<Event | undefined>(undefined);
  readonly reserveConfirmation = signal<ReserveConfirmation | undefined>(undefined);
  readonly pageNotification = signal<PageNotification | undefined>(undefined);
  readonly report = signal<OccupancyReport | undefined>(undefined);
  readonly loading = signal(true);
  readonly actionLoading = signal(false);
  readonly error = signal('');
  readonly showDeleteConfirm = signal(false);
  reservationIdInput = '';

  readonly EventTypeLabels = EventTypeLabels;
  readonly EventStatusLabels = EventStatusLabels;
  readonly ReservationStatusLabels = ReservationStatusLabels;
  readonly ReservationStatus = ReservationStatus;
  readonly hasCancelPenalty = hasCancelPenalty;
  readonly EventStatus = EventStatus;

  reservationForm = this.fb.group({
    quantity: [
      1,
      [Validators.required, Validators.min(1), reservationQuantityValidator(() => this.event())]
    ]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Evento no encontrado.');
      this.loading.set(false);
      return;
    }

    this.eventService.getById(id).subscribe({
      next: event => {
        this.event.set(event);
        this.configureReservationForm(event);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.error?.error ?? 'No se pudo cargar el evento.');
        this.loading.set(false);
      }
    });
  }

  canReserve(): boolean {
    const event = this.event();
    return event ? canReserveEvent(event).allowed : false;
  }

  reservationBlockedReason(): string {
    const event = this.event();
    return event ? canReserveEvent(event).reason : '';
  }

  maxQuantity(): number {
    const event = this.event();
    return event ? getMaxTicketsPerTransaction(event) : 1;
  }

  quantityRuleHint(): string {
    const event = this.event();
    return event ? getQuantityRuleHint(event) : '';
  }

  cancelPenaltyHint(): string {
    const event = this.event();
    return event ? getCancelPenaltyHint(event) : '';
  }

  quantityFieldError(): string {
    const control = this.reservationForm.get('quantity');
    if (!control?.errors || !control.touched) {
      return '';
    }

    if (control.errors['maxTicketsPerTransaction']) {
      const max = control.errors['maxTicketsPerTransaction'].max;
      const event = this.event();
      return event ? getQuantityLimitMessage(event, max) : `Solo puedes reservar hasta ${max} entradas.`;
    }

    if (control.errors['min']) {
      return 'La cantidad debe ser al menos 1.';
    }

    return 'Cantidad no válida.';
  }

  dismissNotification(): void {
    this.pageNotification.set(undefined);
  }

  reserve(): void {
    const event = this.event();
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (!event || !this.canReserve()) {
      this.showPageError(this.reservationBlockedReason());
      return;
    }

    if (this.reservationForm.invalid) {
      this.reservationForm.markAllAsTouched();
      return;
    }

    const value = this.reservationForm.getRawValue();
    const quantity = value.quantity!;
    const total = quantity * event.ticketPrice;

    this.actionLoading.set(true);
    this.clearFeedback();

    this.reservationService
      .create({
        eventId: event.id,
        quantity
      })
      .subscribe({
        next: reservation => {
          this.reserveConfirmation.set({
            reservation,
            quantity,
            total,
            buyerName: this.authService.currentUserName()
          });
          this.reservationIdInput = reservation.id;
          this.reservationForm.reset({ quantity: 1 });
          this.reservationForm.markAsPristine();
          this.reservationForm.markAsUntouched();
          this.actionLoading.set(false);
          this.scrollToNotification();
        },
        error: err => {
          this.showPageError(err.error?.error ?? 'Error al crear la reserva.');
          this.actionLoading.set(false);
        }
      });
  }

  confirmPayment(): void {
    if (!this.reservationIdInput.trim()) {
      this.showPageError('Ingresa el ID de la reserva.');
      return;
    }

    this.actionLoading.set(true);
    this.pageNotification.set(undefined);

    this.reservationService.confirmPayment(this.reservationIdInput.trim()).subscribe({
      next: reservation => {
        this.reservationIdInput = '';
        this.reserveConfirmation.set(undefined);
        this.showPageSuccess('Pago confirmado', [
          `Código de reserva: ${reservation.reservationCode}`,
          `${reservation.quantity} entrada(s) confirmada(s) para ${reservation.buyerName}.`,
          'Guarda el código; lo necesitarás el día del evento.'
        ]);
        this.actionLoading.set(false);
      },
      error: err => {
        this.showPageError(err.error?.error ?? 'Error al confirmar el pago.');
        this.actionLoading.set(false);
      }
    });
  }

  cancelReservation(): void {
    if (!this.reservationIdInput.trim()) {
      this.showPageError('Ingresa el ID de la reserva.');
      return;
    }

    this.actionLoading.set(true);
    this.pageNotification.set(undefined);

    this.reservationService.cancel(this.reservationIdInput.trim()).subscribe({
      next: reservation => {
        this.reservationIdInput = '';
        this.reserveConfirmation.set(undefined);

        if (reservation.lostTickets > 0) {
          this.showPageSuccess('Reserva cancelada', [
            `Se cancelaron ${reservation.quantity} entrada(s) a nombre de ${reservation.buyerName}.`,
            `${reservation.lostTickets} entrada(s) ya no estarán disponibles para otros compradores.`,
            'La cancelación quedó registrada en el reporte del evento.'
          ]);
        } else {
          this.showPageSuccess('Reserva cancelada', [
            `Se cancelaron ${reservation.quantity} entrada(s) a nombre de ${reservation.buyerName}.`,
            'Las entradas vuelven a estar disponibles para otros compradores.',
            'La cancelación quedó registrada en el reporte del evento.'
          ]);
        }

        this.actionLoading.set(false);
      },
      error: err => {
        this.showPageError(err.error?.error ?? 'Error al cancelar la reserva.');
        this.actionLoading.set(false);
      }
    });
  }

  openDeleteConfirm(): void {
    if (!this.event() || !this.authService.isAdmin()) {
      return;
    }

    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    if (!this.actionLoading()) {
      this.showDeleteConfirm.set(false);
    }
  }

  confirmDelete(): void {
    const event = this.event();
    if (!event || !this.authService.isAdmin()) {
      return;
    }

    this.actionLoading.set(true);
    this.clearFeedback();

    this.eventService.delete(event.id).subscribe({
      next: () => {
        this.showDeleteConfirm.set(false);
        this.router.navigate(['/'], {
          state: { deletedEventTitle: event.title }
        });
      },
      error: err => {
        this.showPageError(err.error?.error ?? 'Error al eliminar el evento.');
        this.actionLoading.set(false);
      }
    });
  }

  loadReport(): void {
    const event = this.event();
    if (!event) {
      return;
    }

    this.actionLoading.set(true);
    this.pageNotification.set(undefined);
    this.report.set(undefined);

    this.eventService.getOccupancyReport(event.id).subscribe({
      next: report => {
        this.report.set(report);
        this.actionLoading.set(false);
      },
      error: err => {
        this.showPageError(err.error?.error ?? 'Error al cargar el reporte.');
        this.actionLoading.set(false);
      }
    });
  }

  copyReservationId(id: string): void {
    navigator.clipboard?.writeText(id);
    this.showPageSuccess('ID copiado', ['También puedes ver todas tus reservas en "Mis reservas".']);
  }

  payFromConfirmation(): void {
    const confirmation = this.reserveConfirmation();
    if (!confirmation || confirmation.reservation.status !== ReservationStatus.PendientePago) {
      return;
    }

    this.actionLoading.set(true);
    this.pageNotification.set(undefined);

    this.reservationService.pay(confirmation.reservation.id).subscribe({
      next: reservation => {
        this.reserveConfirmation.set({
          ...confirmation,
          reservation
        });
        const totalFormatted = new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'USD'
        }).format(confirmation.total);
        this.showPageSuccess('Pago completado', [
          `Total pagado: ${totalFormatted}`,
          `Tu código de entrada: ${reservation.reservationCode}`,
          'Guárdalo para presentarlo el día del evento.'
        ]);
        this.actionLoading.set(false);
        this.scrollToNotification();
      },
      error: err => {
        this.showPageError(err.error?.error ?? 'No se pudo completar el pago.');
        this.actionLoading.set(false);
      }
    });
  }

  private configureReservationForm(event: Event): void {
    const quantityControl = this.reservationForm.get('quantity');
    quantityControl?.setValidators([
      Validators.required,
      Validators.min(1),
      Validators.max(getMaxTicketsPerTransaction(event)),
      reservationQuantityValidator(() => this.event())
    ]);
    quantityControl?.updateValueAndValidity();
  }

  private clearFeedback(): void {
    this.pageNotification.set(undefined);
    this.error.set('');
  }

  private showPageSuccess(title: string, details: string[]): void {
    this.pageNotification.set({ type: 'success', title, details });
    this.scrollToNotification();
  }

  private showPageError(message: string): void {
    this.pageNotification.set({
      type: 'error',
      title: 'Algo salió mal',
      details: [message]
    });
    this.scrollToNotification();
  }

  private scrollToNotification(): void {
    setTimeout(() => {
      this.notificationAnchor()?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}
