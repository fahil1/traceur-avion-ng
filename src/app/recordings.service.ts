import { Injectable } from '@angular/core';

import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Recording } from './recording';

@Injectable({
  providedIn: 'root'
})
export class RecordingsService {
  private recordingsUrl = 'http://localhost:8080/api/recordings';
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

  getRecordings(): Observable<Recording[]> {
    return this.http.get<Recording[]>(this.recordingsUrl).pipe(
      catchError(this.handleError('getRecordings', []))
    );
  }

  removeRecording(recording: Recording | number): Observable<Recording> {
    const id = typeof recording === 'number' ? recording : recording.id;
    const url = `${this.recordingsUrl}/${id}`;

    return this.http.delete<Recording>(url, this.httpOptions).pipe(catchError(this.handleError<Recording>('removeRecording')));
  }

  saveRecording(recording: Recording): Observable<Recording> {
    return this.http.post<Recording>(this.recordingsUrl, recording, this.httpOptions).pipe(
      catchError(this.handleError<Recording>('addRecording'))
    );
  }

  updateRecording(recording: Recording): Observable<Recording> {
    return this.http.put<Recording>(this.recordingsUrl, recording, this.httpOptions).pipe(
      catchError(this.handleError<Recording>('updateRecording'))
    );
  }

}
