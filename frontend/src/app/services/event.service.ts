import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CreateEventRequest, Event, EventFilter, OccupancyReport } from '../models/event.model';

@Injectable({ providedIn: 'root' })
export class EventService {
  private readonly baseUrl = `${environment.apiUrl}/events`;

  constructor(private readonly http: HttpClient) {}

  getAll(filter: EventFilter = {}) {
    let params = new HttpParams();

    if (filter.type != null) params = params.set('type', filter.type);
    if (filter.venueId != null) params = params.set('venueId', filter.venueId);
    if (filter.status != null) params = params.set('status', filter.status);
    if (filter.startDateFrom) params = params.set('startDateFrom', filter.startDateFrom);
    if (filter.startDateTo) params = params.set('startDateTo', filter.startDateTo);
    if (filter.titleSearch) params = params.set('titleSearch', filter.titleSearch);

    return this.http.get<Event[]>(this.baseUrl, { params });
  }

  getById(id: string) {
    return this.http.get<Event>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateEventRequest) {
    return this.http.post<Event>(this.baseUrl, request);
  }

  getOccupancyReport(id: string) {
    return this.http.get<OccupancyReport>(`${this.baseUrl}/${id}/occupancy-report`);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
