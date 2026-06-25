import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Venue } from '../models/venue.model';

@Injectable({ providedIn: 'root' })
export class VenueService {
  private readonly baseUrl = `${environment.apiUrl}/venues`;

  constructor(private readonly http: HttpClient) {}

  getAll() {
    return this.http.get<Venue[]>(this.baseUrl);
  }
}
