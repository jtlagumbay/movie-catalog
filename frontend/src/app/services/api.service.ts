import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Movie } from '../models/movie.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  getMovies(): Observable< Movie[] > {
    return this.http.get<Movie[]>(`${this.apiUrl}/movies/`);
  }

  getMovie(id: number): Observable<Movie> {
    return this.http.get<Movie>(`${this.apiUrl}/movies/${id}/`);
  }

  createMovie(formData: FormData): Observable<Movie> {
    return this.http.post<Movie>(`${this.apiUrl}/movies/`, formData);
  }

  updateMovie(id: number, formData: FormData): Observable<Movie> {
    return this.http.put<Movie>(`${this.apiUrl}/movies/${id}/`, formData);
  }

  deleteMovie(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/movies/${id}/`);
  }
}