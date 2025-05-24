// video-player.component.ts
import { Component, Input, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { VideoInfo } from '../../models/movie.model';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.css',
})
export class VideoPlayerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() videoUrl: string = '';
  @Input() posterUrl: string = '';
  @Input() videoInfo: VideoInfo | null = null;
  @Input() muted: boolean = false;
  @Input() controls: boolean = false;
  @Input() autoplay: boolean = false;
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;

  isLoading = true;
  loadingProgress = 0;
  hasError = false;

  ngOnInit() {
    // Preload video metadata when component initializes
    if (this.videoUrl) {
      this.preloadVideo();
    }
  }

  ngAfterViewInit() {
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.muted = this.muted;
    }
  }


  ngOnDestroy() {
    // Clean up video element to free memory
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.src = '';
      this.videoElement.nativeElement.load();
    }
  }

  preloadVideo() {
    // Create a temporary video element to start preloading
    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';
    tempVideo.src = this.videoUrl;
    
    tempVideo.addEventListener('loadedmetadata', () => {
      // Metadata loaded, video should start faster now
      console.log('Video metadata preloaded');
    });
  }

  onLoadStart() {
    this.isLoading = true;
    this.hasError = false;
    this.loadingProgress = 0;
  }

  onLoadedMetadata() {
    console.log('Video metadata loaded');
    this.loadingProgress = 25;
  }

  onLoadedData() {
    console.log('Video data loaded');
    this.loadingProgress = 50;
  }

  onProgress() {
    if (this.videoElement?.nativeElement) {
      const video = this.videoElement.nativeElement;
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        if (duration > 0) {
          this.loadingProgress = Math.min((bufferedEnd / duration) * 100, 95);
        }
      }
    }
  }

  onCanPlay() {
    console.log('Video can start playing');
    this.loadingProgress = 75;
  }

  onCanPlayThrough() {
    console.log('Video can play through without stopping');
    this.isLoading = false;
    this.loadingProgress = 100;
  }

  onError(event: any) {
    console.error('Video loading error:', event);
    this.hasError = true;
    this.isLoading = false;
  }

  onWaiting() {
    console.log('Video waiting for more data');
    // You could show a small loading indicator here
  }

  onPlaying() {
    this.isLoading = false;
  }

  retryLoad() {
    this.hasError = false;
    this.isLoading = true;
    this.loadingProgress = 0;
    
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.load();
    }
  }
}