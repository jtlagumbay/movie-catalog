from django.db import models
import os
from django.core.exceptions import ValidationError
import cv2
class MovieManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    
class Movie(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    date_added = models.DateField(auto_now_add=True)
    date_updated = models.DateField(auto_now=True)
    video_file = models.FileField(upload_to='videos/')
    thumbnail = models.ImageField(upload_to='thumbnails/', null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    thumbnail_processing = models.BooleanField(default=False) 
    
    objects = MovieManager() 
    all_objects = models.Manager() 

    def soft_delete(self):
        self.is_deleted = True
        self.save()

    
    def __str__(self):
        return self.title
    
    
    def get_streaming_url(self):
        """Return URL for streaming endpoint instead of direct file URL"""
        from django.urls import reverse
        return reverse('video_stream', kwargs={'movie_id': self.pk})
    
    def get_video_info(self):
        """Return video metadata for frontend"""
        if not self.video_file:
            return None
            
        try:
            cap = cv2.VideoCapture(self.video_file.path)
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            duration = frame_count / fps if fps > 0 else 0
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            cap.release()
            
            return {
                'duration': duration,
                'width': width,
                'height': height,
                'fps': fps,
                'size': os.path.getsize(self.video_file.path)
            }
        except ImportError:
            # Fallback without opencv
            return {
                'size': os.path.getsize(self.video_file.path)
            }
    

    def generate_thumbnail_async(self):
        """Trigger async thumbnail generation"""
        if not self.thumbnail and not self.thumbnail_processing:
            self.thumbnail_processing = True
            self.save(update_fields=['thumbnail_processing'])
            
            from .tasks import generate_thumbnail_task
            generate_thumbnail_task.delay(self.id)
    
