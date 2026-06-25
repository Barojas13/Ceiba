import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router, RouterLink } from '@angular/router';

import { EventService } from '../../services/event.service';

import { VenueService } from '../../services/venue.service';

import { Venue } from '../../models/venue.model';

import { EventType, EventTypeLabels } from '../../models/enums';

import { extractApiError } from '../../utils/api-error.util';
import { formatPriceInput, parsePriceInput, priceValidator } from '../../utils/price-format.util';

import {

  endDateAfterStartValidator,

  futureDateTimeValidator,

  toDateTimeLocalValue,
  toApiLocalDateTime,
  venueCapacityValidator,
  weekendNightStartValidator

} from '../../validators/event-form.validators';



@Component({

  selector: 'app-event-create',

  standalone: true,

  imports: [CommonModule, ReactiveFormsModule, RouterLink],

  templateUrl: './event-create.component.html',

  styleUrl: './event-create.component.scss',

  changeDetection: ChangeDetectionStrategy.Default

})

export class EventCreateComponent implements OnInit {

  private readonly fb = inject(FormBuilder);

  private readonly eventService = inject(EventService);

  private readonly venueService = inject(VenueService);

  private readonly router = inject(Router);



  readonly venues = signal<Venue[]>([]);

  readonly loading = signal(false);

  readonly apiError = signal('');

  readonly success = signal('');

  readonly submitAttempted = signal(false);

  readonly validationErrors = signal<string[]>([]);



  readonly eventTypes = Object.entries(EventTypeLabels).map(([value, label]) => ({

    value: Number(value) as EventType,

    label

  }));



  form = this.fb.group({

    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],

    description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],

    venueId: [null as number | null, Validators.required],

    maxCapacity: [

      null as number | null,

      [

        Validators.required,

        Validators.min(1),

        venueCapacityValidator(() => this.selectedVenueCapacity())

      ]

    ],

    startDate: ['', [Validators.required, futureDateTimeValidator(), weekendNightStartValidator()]],

    endDate: ['', [Validators.required, endDateAfterStartValidator()]],

    ticketPrice: ['', [Validators.required, priceValidator()]],

    type: [EventType.Conferencia, Validators.required]

  });



  ngOnInit(): void {

    this.venueService.getAll().subscribe({

      next: venues => this.venues.set(venues),

      error: () => this.apiError.set('No se pudieron cargar los lugares. Intenta de nuevo en unos momentos.')

    });



    this.form.get('startDate')?.valueChanges.subscribe(() => {

      this.form.get('endDate')?.updateValueAndValidity({ emitEvent: false });

    });



    this.form.get('venueId')?.valueChanges.subscribe(() => {

      this.form.get('maxCapacity')?.updateValueAndValidity({ emitEvent: false });

    });

  }



  submit(): void {

    this.submitAttempted.set(true);

    this.form.markAllAsTouched();

    this.apiError.set('');

    this.success.set('');

    this.validationErrors.set(this.buildValidationMessages());



    if (this.form.invalid) {

      return;

    }



    const value = this.form.getRawValue();
    const ticketPrice = parsePriceInput(value.ticketPrice);

    if (ticketPrice === null) {
      this.form.get('ticketPrice')?.setErrors({ invalidPrice: true });
      this.form.get('ticketPrice')?.markAsTouched();
      this.validationErrors.set(this.buildValidationMessages());
      return;
    }

    this.loading.set(true);

    this.eventService
      .create({
        title: value.title!.trim(),
        description: value.description!.trim(),
        venueId: Number(value.venueId),
        maxCapacity: Number(value.maxCapacity),
        startDate: toApiLocalDateTime(value.startDate!),
        endDate: toApiLocalDateTime(value.endDate!),
        ticketPrice,
        type: value.type!
      })

      .subscribe({

        next: event => {

          this.success.set('Evento creado correctamente. Redirigiendo...');

          this.loading.set(false);

          setTimeout(() => this.router.navigate(['/events', event.id]), 800);

        },

        error: err => {

          this.apiError.set(extractApiError(err, 'Error al crear el evento.'));

          this.loading.set(false);

        }

      });

  }



  formatTicketPriceField(): void {
    const control = this.form.get('ticketPrice');
    const formatted = formatPriceInput(control?.value);
    control?.setValue(formatted, { emitEvent: false });
  }

  unformatTicketPriceField(): void {
    const control = this.form.get('ticketPrice');
    const parsed = parsePriceInput(control?.value);
    if (parsed !== null) {
      control?.setValue(String(parsed), { emitEvent: false });
    }
  }

  ticketPricePreview(): string {
    const parsed = parsePriceInput(this.form.get('ticketPrice')?.value);
    return parsed === null ? '' : formatPriceInput(parsed);
  }

  descriptionLength(): number {

    return (this.form.get('description')?.value ?? '').length;

  }



  minDateTimeLocal(): string {

    const date = new Date();

    date.setMinutes(date.getMinutes() + 1);

    return toDateTimeLocalValue(date);

  }



  minEndDateTimeLocal(): string {

    const startValue = this.form.get('startDate')?.value;

    if (startValue) {

      const start = new Date(startValue);

      start.setMinutes(start.getMinutes() + 1);

      return toDateTimeLocalValue(start);

    }



    return this.minDateTimeLocal();

  }



  selectedVenueCapacity(): number | null {

    const venueId = this.form.get('venueId')?.value;

    if (venueId === null || venueId === undefined) {

      return null;

    }



    return this.venues().find(venue => venue.id === Number(venueId))?.capacity ?? null;

  }



  isInvalid(controlName: string): boolean {

    const control = this.form.get(controlName);

    return !!control && control.invalid && (control.touched || this.submitAttempted());

  }



  fieldError(controlName: string): string {

    const control = this.form.get(controlName);

    if (!control?.errors || !this.isInvalid(controlName)) {

      return '';

    }



    const errors = control.errors;



    switch (controlName) {

      case 'title':

        if (errors['required']) return 'Ingresa un título.';

        if (errors['minlength'] || errors['maxlength']) {

          return 'El título debe tener entre 5 y 100 caracteres.';

        }

        break;

      case 'description':

        if (errors['required']) return 'Ingresa una descripción.';

        if (errors['minlength']) {

          return `La descripción debe tener al menos 10 caracteres (tienes ${this.descriptionLength()}).`;

        }

        break;

      case 'venueId':

        if (errors['required']) return 'Selecciona un lugar.';

        break;

      case 'maxCapacity':

        if (errors['required']) return 'Indica la capacidad máxima.';

        if (errors['min']) return 'La capacidad debe ser mayor a 0.';

        if (errors['exceedsVenueCapacity']) {

          return `La capacidad no puede superar ${errors['exceedsVenueCapacity'].capacity} personas.`;

        }

        break;

      case 'ticketPrice':
        if (errors['required']) return 'Ingresa el precio de la entrada.';
        if (errors['invalidPrice']) return 'Revisa el precio. Ejemplo: 1,500.50';
        if (errors['min']) return 'El precio debe ser mayor a 0.';
        break;

      case 'startDate':

        if (errors['required']) return 'Selecciona la fecha y hora de inicio.';

        if (errors['invalidDate']) return 'La fecha de inicio no es válida.';

        if (errors['futureDate']) {
          return 'La fecha de inicio debe ser posterior a la hora actual.';
        }

        if (errors['weekendNight']) {

          return 'En fin de semana el evento no puede empezar después de las 10:00 p. m.';

        }

        break;

      case 'endDate':

        if (errors['required']) return 'Selecciona la fecha y hora de fin.';

        if (errors['invalidDate']) return 'La fecha de fin no es válida.';

        if (errors['endBeforeStart']) {

          return 'La fecha de fin debe ser posterior a la fecha de inicio.';

        }

        break;

    }



    return 'Valor no válido.';

  }



  private buildValidationMessages(): string[] {

    const fields = ['title', 'description', 'venueId', 'maxCapacity', 'ticketPrice', 'startDate', 'endDate'];

    return fields

      .map(name => this.fieldError(name))

      .filter(message => message.length > 0);

  }

}

