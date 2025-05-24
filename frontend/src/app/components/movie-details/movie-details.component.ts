// import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { Movie } from '../../models/movie.model';
// import { ApiService } from '../../services/api.service';
// import { CommonModule } from '@angular/common';
// import { VideoPlayerComponent } from '../video-player/video-player.component';

// @Component({
//   selector: 'app-movie-details',
//   standalone: true, 
//   imports: [CommonModule, VideoPlayerComponent], 
//   templateUrl: './movie-details.component.html',
//   styleUrls: ['./movie-details.component.css'],
  
// })
// export class MovieDetailsComponent implements OnInit {
//   movie: Movie | null = null;
//   loading = true;
//   error: string | null = null;

//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private apiService: ApiService
//   ) { }

//   ngOnInit(): void {
//     const id = this.route.snapshot.paramMap.get('id');
//     if (id) {
//       this.loadMovie(+id);
//     }
//   }

//   loadMovie(id: number): void {
//     this.apiService.getMovie(id).subscribe({
//       next: (movie) => {
//         this.movie = movie;
//         this.loading = false;
//       },
//       error: (error) => {
//         console.error('Error loading movie:', error);
//         this.error = 'Failed to load movie details';
//         this.loading = false;
//       }
//     });
//   }

//   editMovie(): void {
//     if (this.movie) {
//       this.router.navigate(['/movies/update', this.movie.id]);
//     }
//   }

//   deleteMovie(): void {
//     if (this.movie && confirm('Are you sure you want to delete this movie?')) {
//       this.apiService.deleteMovie(this.movie.id).subscribe({
//         next: () => {
//           this.router.navigate(['/movies']);
//         },
//         error: (error) => {
//           console.error('Error deleting movie:', error);
//         }
//       });
//     }
//   }

//   goBack(): void {
//     this.router.navigate(['/movies']);
//   }
// }

import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Movie } from '../../models/movie.model';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { VideoPlayerComponent } from '../video-player/video-player.component';
import { Subject, takeUntil, finalize, catchError, of, delay } from 'rxjs';

@Component({
  selector: 'app-movie-details',
  standalone: true, 
  imports: [CommonModule, VideoPlayerComponent], 
  templateUrl: './movie-details.component.html',
  styleUrls: ['./movie-details.component.css'],
})
export class MovieDetailsComponent implements OnInit, OnDestroy {
  movie: Movie | null = null;
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  
  // UI State
  showDropdown: boolean = false;
  showDeleteModal: boolean = false;
  isDeletingMovie: boolean = false;
  isVideoExpanded: boolean = false;
  isLiked: boolean = false;
  isInWatchlist: boolean = false;
  
  private destroy$: Subject<void> = new Subject<void>();
  private movieId: number = 0;
  private retryAttempts: number = 0;
  private maxRetries: number = 3;

  @ViewChild('moreButton') moreButton?: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.movieId = +id;
      this.loadMovie(this.movieId);
    } else {
      this.handleError({ message: 'Invalid movie ID' });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (this.moreButton && !this.moreButton.nativeElement.contains(event.target)) {
      this.showDropdown = false;
    }
  }

  loadMovie(id: number): void {
    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';

    this.apiService.getMovie(id)
      .pipe(
        takeUntil(this.destroy$),
        delay(300), // Minimum loading time for better UX
        catchError((error) => {
          console.error('Error loading movie:', error);
          this.handleError(error);
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (movie: Movie | null) => {
          if (movie) {
            this.movie = movie;
            this.initializeMovieState();
            this.retryAttempts = 0;
          } else if (!this.hasError) {
            this.handleError({ message: 'Movie not found' });
          }
        }
      });
  }

  private initializeMovieState(): void {
    // Initialize UI state based on movie data or user preferences
    this.isLiked = false; // Load from user preferences/API
    this.isInWatchlist = false; // Load from user preferences/API
  }

  private handleError(error: any): void {
    this.hasError = true;
    
    if (error.status === 404) {
      this.errorMessage = 'Movie not found. It may have been deleted or moved.';
    } else if (error.status === 0) {
      this.errorMessage = 'Unable to connect to the server. Please check your internet connection.';
    } else if (error.status >= 400 && error.status < 500) {
      this.errorMessage = 'There was a problem loading the movie details. Please try again.';
    } else if (error.status >= 500) {
      this.errorMessage = 'Server error. Please try again later.';
    } else {
      this.errorMessage = error.message || 'An unexpected error occurred.';
    }
  }

  retryLoad(): void {
    if (this.retryAttempts < this.maxRetries) {
      this.retryAttempts++;
      this.loadMovie(this.movieId);
    } else {
      this.errorMessage = 'Multiple attempts failed. Please refresh the page or try again later.';
    }
  }

  // Navigation Methods
  goBack(): void {
    this.router.navigate(['/movies']);
  }

  editMovie(): void {
    if (this.movie) {
      this.router.navigate(['/movies/update', this.movie.id]);
    }
  }

  playMovie(): void {
    if (this.movie) {
      // Navigate to full-screen player or implement inline playback
      this.router.navigate(['/movies', this.movie.id, 'play']);
    }
  }

  // Interactive Methods
  toggleLike(): void {
    this.isLiked = !this.isLiked;
    
    // Call API to update like status
    if (this.movie) {
      // this.apiService.toggleMovieLike(this.movie.id, this.isLiked).subscribe();
    }
  }

  toggleWatchlist(): void {
    this.isInWatchlist = !this.isInWatchlist;
    
    // Call API to update watchlist status
    if (this.movie) {
      // this.apiService.toggleWatchlist(this.movie.id, this.isInWatchlist).subscribe();
    }
  }

  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  hideDropdown(): void {
    this.showDropdown = false;
  }

  toggleVideoExpanded(): void {
    this.isVideoExpanded = !this.isVideoExpanded;
  }

  // Delete Methods
  confirmDelete(): void {
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
  }

  deleteMovie(): void {
    if (!this.movie || this.isDeletingMovie) return;

    this.isDeletingMovie = true;
    
    this.apiService.deleteMovie(this.movie.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isDeletingMovie = false;
        })
      )
      .subscribe({
        next: () => {
          this.showDeleteModal = false;
          // Show success message briefly before navigating
          this.router.navigate(['/movies'], { 
            queryParams: { deleted: this.movie?.title } 
          });
        },
        error: (error) => {
          console.error('Error deleting movie:', error);
          this.showDeleteModal = false;
          // You could show a toast notification here
          alert('Failed to delete movie. Please try again.');
        }
      });
  }

  // Utility Methods
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

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}