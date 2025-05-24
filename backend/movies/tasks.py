from celery import shared_task
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from PIL import Image
import cv2
import os
import logging
from io import BytesIO

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def generate_thumbnail_task(self, movie_id):
    """
    Generate thumbnail for a movie using OpenCV
    """
    try:
        from .models import Movie
        
        # Get the movie instance
        try:
            movie = Movie.objects.get(id=movie_id, is_deleted=False)
        except Movie.DoesNotExist:
            logger.error(f"Movie with id {movie_id} not found")
            return f"Movie with id {movie_id} not found"
        
        # Check if video file exists
        if not movie.video_file or not os.path.exists(movie.video_file.path):
            logger.error(f"Video file not found for movie {movie_id}")
            return f"Video file not found for movie {movie_id}"
        
        # Generate thumbnail
        thumbnail_path = extract_thumbnail(movie.video_file.path, movie_id)
        
        if thumbnail_path:
            # Save thumbnail to model
            with open(thumbnail_path, 'rb') as f:
                thumbnail_name = f"thumbnail_{movie_id}.jpg"
                movie.thumbnail.save(
                    thumbnail_name,
                    ContentFile(f.read()),
                    save=True
                )
            
            # Clean up temporary file
            os.remove(thumbnail_path)
            
            logger.info(f"Thumbnail generated successfully for movie {movie_id}")
            return f"Thumbnail generated for movie: {movie.title}"
        else:
            raise Exception("Failed to extract thumbnail")
            
    except Exception as exc:
        logger.error(f"Error generating thumbnail for movie {movie_id}: {str(exc)}")
        
        # Retry with exponential backoff
        if self.request.retries < self.max_retries:
            raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
        else:
            return f"Failed to generate thumbnail after {self.max_retries} retries: {str(exc)}"


def extract_thumbnail(video_path, movie_id, frame_time=10):
    """
    Extract thumbnail from video at specified time
    """
    try:
        # Open video file
        cap = cv2.VideoCapture(video_path)
        
        if not cap.isOpened():
            logger.error(f"Could not open video file: {video_path}")
            return None
        
        # Get video properties
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        duration = total_frames / fps if fps > 0 else 0
        
        # Calculate frame number (default to 10 seconds or 10% of video)
        target_time = min(frame_time, duration * 0.1) if duration > 0 else frame_time
        frame_number = int(target_time * fps) if fps > 0 else 0
        
        # Set video position
        cap.set(cv2.CAP_PROP_POS_FRAMES, frame_number)
        
        # Read frame
        ret, frame = cap.read()
        cap.release()
        
        if not ret or frame is None:
            logger.error("Could not read frame from video")
            return None
        
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Create PIL Image
        pil_image = Image.fromarray(frame_rgb)
        
        # Resize thumbnail (maintain aspect ratio)
        thumbnail_size = (300, 200)  # width, height
        pil_image.thumbnail(thumbnail_size, Image.Resampling.LANCZOS)
        
        # Create new image with padding if needed
        thumbnail = Image.new('RGB', thumbnail_size, (0, 0, 0))
        
        # Center the resized image
        x = (thumbnail_size[0] - pil_image.width) // 2
        y = (thumbnail_size[1] - pil_image.height) // 2
        thumbnail.paste(pil_image, (x, y))
        
        # Save temporary thumbnail
        temp_path = f"/tmp/thumbnail_{movie_id}_{os.getpid()}.jpg"
        thumbnail.save(temp_path, 'JPEG', quality=85)
        
        return temp_path
        
    except Exception as e:
        logger.error(f"Error extracting thumbnail: {str(e)}")
        return None


@shared_task
def generate_missing_thumbnails():
    """
    Generate thumbnails for movies that don't have them
    """
    from .models import Movie
    
    movies_without_thumbnails = Movie.objects.filter(
        thumbnail__isnull=True,
        is_deleted=False,
        video_file__isnull=False
    ).exclude(video_file='')
    
    count = 0
    for movie in movies_without_thumbnails:
        try:
            # Queue individual thumbnail generation tasks
            generate_thumbnail_task.delay(movie.id)
            count += 1
        except Exception as e:
            logger.error(f"Error queuing thumbnail task for movie {movie.id}: {str(e)}")
    
    return f"Queued thumbnail generation for {count} movies"