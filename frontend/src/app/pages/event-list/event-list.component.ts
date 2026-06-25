import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { VenueService } from '../../services/venue.service';

import { Event } from '../../models/event.model';

import { Venue } from '../../models/venue.model';

import {

  EventStatus,

  EventStatusLabels,

  EventType,

  EventTypeLabels

} from '../../models/enums';



@Component({

  selector: 'app-event-list',

  standalone: true,

  imports: [CommonModule, FormsModule, RouterLink],

  templateUrl: './event-list.component.html',

  styleUrl: './event-list.component.scss'

})

export class EventListComponent implements OnInit {
  private readonly eventService = inject(EventService);
  private readonly venueService = inject(VenueService);

  readonly events = signal<Event[]>([]);
  readonly venues = signal<Venue[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal('');



  filterType?: EventType;

  filterVenueId?: number;

  filterStatus?: EventStatus;

  titleSearch = '';



  readonly eventTypes = Object.entries(EventTypeLabels).map(([value, label]) => ({

    value: Number(value) as EventType,

    label

  }));



  readonly eventStatuses = Object.entries(EventStatusLabels).map(([value, label]) => ({

    value: Number(value) as EventStatus,

    label

  }));



  readonly EventTypeLabels = EventTypeLabels;

  readonly EventStatusLabels = EventStatusLabels;



  ngOnInit(): void {
    const deletedTitle = history.state?.deletedEventTitle as string | undefined;
    if (deletedTitle) {
      this.success.set(`Evento "${deletedTitle}" eliminado correctamente.`);
    }

    this.venueService.getAll().subscribe({

      next: venues => this.venues.set(venues),

      error: () => this.error.set('No se pudieron cargar los lugares.')

    });

    this.loadEvents();

  }



  loadEvents(): void {

    this.loading.set(true);

    this.error.set('');



    this.eventService

      .getAll({

        type: this.filterType,

        venueId: this.filterVenueId,

        status: this.filterStatus,

        titleSearch: this.titleSearch || undefined

      })

      .subscribe({

        next: events => {

          this.events.set(events);

          this.loading.set(false);

        },

        error: err => {

          this.error.set(err.error?.error ?? 'Error al cargar eventos.');

          this.loading.set(false);

        }

      });

  }



  clearFilters(): void {

    this.filterType = undefined;

    this.filterVenueId = undefined;

    this.filterStatus = undefined;

    this.titleSearch = '';

    this.loadEvents();

  }

}

