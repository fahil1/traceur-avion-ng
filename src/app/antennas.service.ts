import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { HttpClient, HttpHeaders } from '@angular/common/http';


import { Antenna } from './antenna';


@Injectable({
  providedIn: 'root'
})
export class AntennasService {
  // private antennasUrl = 'api/antennas';
  private antennasUrl = 'http://localhost:8080/api/antennas';
  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
  };

  constructor(
    private http: HttpClient
  ) { }
  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      console.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  getAntennas(): Observable<Antenna[]> {
    return this.http.get<Antenna[]>(this.antennasUrl).pipe(
      catchError(this.handleError('getAntennas', []))
    );
  }

  removeAntenna(antenna: Antenna | number) {
    const id = typeof antenna === 'number' ? antenna : antenna.id;
    const url = `${this.antennasUrl}/${id}`;

    return this.http.delete<Antenna>(url, this.httpOptions).pipe(catchError(this.handleError<Antenna>('removeAntenna')));
  }
}
