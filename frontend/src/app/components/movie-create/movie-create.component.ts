import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Movie } from '../../models/movie.model';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';
import { VideoPlayerComponent } from '../video-player/video-player.component';
import { StmtModifier } from '@angular/compiler';
@Component({
  selector: 'app-movie-create',
  standalone: true, 
  imports: [CommonModule, ReactiveFormsModule, VideoPlayerComponent], 
  templateUrl: './movie-create.component.html',
  styleUrls: ['./movie-create.component.css']
})
export class MovieCreateComponent implements OnInit {
  movieForm: FormGroup;
  isEditMode = false;
  movieId: number | null = null;
  loading = false;
  selectedFile: File | null = null;
  videoPreviewUrl: string | null = null;
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private toastService: ToastService
  ) {
    this.movieForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      video_file: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.movieId = +id;
      this.movieForm.get('video_file')?.clearValidators();
      this.movieForm.get('video_file')?.updateValueAndValidity();
      this.loadMovie(this.movieId);
    }

    this.logFormErrors()
  }

  loadMovie(id: number): void {
    this.apiService.getMovie(id).subscribe({
      next: (movie) => {
        this.movieForm.patchValue({
          title: movie.title,
          description: movie.description,
          video_file: movie.video_file,
          date_added: movie.date_added
        });
        this.videoPreviewUrl = movie.video_file;
        console.log(this.videoPreviewUrl)
        this.logFormErrors()
        this.movieForm.markAllAsTouched();


      },
      error: (error) => {
        console.error('Error loading movie:', error);
        this.toastService.showError(error)
      }
    });
  }

  onSubmit(): void {
    if (this.movieForm.valid) {
      this.loading = true;

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', this.movieForm.get('title')?.value);
      formData.append('description', this.movieForm.get('description')?.value);
      
      if (this.selectedFile) {
        console.log("onSubmit "+this.selectedFile)
        formData.append('video_file', this.selectedFile);
      } 

      console.log(formData.entries())
      console.log(this.movieForm.get('title'))
      console.log(this.movieForm.get('description'))
      console.log(this.movieForm.get('video_file'))
        // DEBUG: Inspect actual form data
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      const operation = this.isEditMode && this.movieId
        ? this.apiService.updateMovie(this.movieId, formData)
        : this.apiService.createMovie(formData);

      operation.subscribe({
        next: () => {
          // Clean up preview URL
          if (this.videoPreviewUrl && this.selectedFile) {
            URL.revokeObjectURL(this.videoPreviewUrl);
          }
          this.toastService.showSuccess("Movie created successfuly.")
          this.router.navigate(['/movies']);
        },
        error: (error) => {
          console.error('Error saving movie:', error);
          this.loading = false;
          this.toastService.showError("Error creating movie.")

        }
      });
    }
  }
  onFileSelected(event: Event): void {
    console.log("on file select")
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      console.log(file)
      
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid video file (MP4, AVI, MOV, WMV, WebM)');
        input.value = '';
        return;
      }

      this.selectedFile = file;
      this.movieForm.patchValue({ video_file: file.name });
      this.movieForm.get('video_file')?.updateValueAndValidity();

      // Create preview URL
      this.videoPreviewUrl = URL.createObjectURL(file);
    }
  }

  removeFile(): void {
    this.selectedFile = null;
    this.videoPreviewUrl = null;
    this.movieForm.patchValue({ video_file: '' });
    this.movieForm.get('video_file')?.updateValueAndValidity();
    
    // Clear file input
    const fileInput = document.getElementById('video_file') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  cancel(): void {
    this.router.navigate(['/movies']);
  }

  get title() { return this.movieForm.get('title'); }
  get description() { return this.movieForm.get('description'); }
  get video_file() { return this.movieForm.get('video_file'); }

  logFormErrors(): void {
    console.log('=== FORM VALIDATION DEBUG ===');
    console.log('Form valid:', this.movieForm.valid);
    console.log('Form status:', this.movieForm.status);
    console.log('Form errors:', this.movieForm.errors);
    
    Object.keys(this.movieForm.controls).forEach(key => {
      const control = this.movieForm.get(key);
      if (control && !control.valid) {
        console.log(`${key} - Valid: ${control.valid}, Errors:`, control.errors);
        console.log(`${key} - Value:`, control.value);
        console.log(`${key} - Status:`, control.status);
      }
    });
    console.log('=== END DEBUG ===');
  }
}