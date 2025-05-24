import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { Movie } from '../../models/movie.model';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { VideoPlayerComponent } from '../video-player/video-player.component';
import { Subject, takeUntil, finalize, catchError, of, delay } from 'rxjs';

@Component({
  selector: 'app-movies',
  standalone: true,
  imports: [CommonModule, VideoPlayerComponent],
  templateUrl: './movies.component.html',
  styleUrl: './movies.component.css'
})
export class MoviesComponent implements OnInit, OnDestroy {
  movies: Movie[] = [];
  isLoading: boolean = false;
  hasError: boolean = false;
  errorMessage: string = '';
  skeletonItems: number[] = Array(8).fill(0); // For skeleton loading
  
  private destroy$: Subject<void> = new Subject<void>();
  private retryAttempts: number = 0;
  private maxRetries: number = 3;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadMovies();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMovies(): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.apiService.getMovies()
      .pipe(
        takeUntil(this.destroy$),
        delay(500), // Minimum loading time for better UX
        catchError((error) => {
          console.error('Error loading movies:', error);
          this.handleError(error);
          return of([]); // Return empty array on error
        }),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: Movie[]) => {
          if (response && Array.isArray(response)) {
            this.movies = response.map(movie => ({
              ...movie,
              isLiked: false // Initialize like state
            }));
            this.retryAttempts = 0; // Reset retry counter on success
          } else {
            this.movies = [];
          }
        }
      });
  }

  private handleError(error: any): void {
    this.hasError = true;
    
    // Customize error messages based on error type
    if (error.status === 0) {
      this.errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.status >= 400 && error.status < 500) {
      this.errorMessage = 'There was a problem with your request. Please try again.';
    } else if (error.status >= 500) {
      this.errorMessage = 'Server error. Our team has been notified. Please try again later.';
    } else if (error.name === 'TimeoutError') {
      this.errorMessage = 'The request timed out. Please try again.';
    } else {
      this.errorMessage = 'Something went wrong. Please try again.';
    }
  }

  retryLoad(): void {
    if (this.retryAttempts < this.maxRetries) {
      this.retryAttempts++;
      this.loadMovies();
    } else {
      this.errorMessage = 'Multiple attempts failed. Please refresh the page or try again later.';
    }
  }

  trackByMovieId(index: number, movie: Movie): number {
    return movie.id;
  }

  navigateToDetails(id: number): void {
    this.router.navigate(['/movies', id]);
  }

  navigateToCreate(): void {
    this.router.navigate(['/movies/create']);
  }

  onCardHover(movieId: number, isHovering: boolean): void {
    // Handle card hover effects
    // You can implement additional hover logic here
  }

  toggleLike(movieId: number): void {
    const movie = this.movies.find(m => m.id === movieId);
    if (movie) {
      movie.is_liked = !movie.is_liked;

    }
  }

  getYear(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.getFullYear().toString();
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  truncateDescription(description: string, maxLength: number = 120): string {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength).trim() + '...';
  }
}