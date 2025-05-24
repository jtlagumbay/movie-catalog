from django.core.cache import cache
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Movie
# from .tasks import generate_thumbnail
import time
import os
from django.conf import settings
from django.db import models


@receiver(post_save, sender=Movie)
def invalidate_movie_cache_on_save(sender, instance, created, **kwargs):
    """
    Invalidate relevant caches when a movie is saved.
    - Always clear list cache (new movie affects list)
    - Clear specific detail cache for this movie
    """
    # Clear list cache with proper prefix
    cache.delete_many([
        'movies:list:*'  # This will clear all list cache variations
    ])
    
    # Use cache.delete with pattern matching if your cache backend supports it
    # Otherwise, we'll need to track cache keys more explicitly
    _clear_list_cache()
    
    # Clear detail cache for this specific movie
    detail_cache_key = f'movies:detail:{instance.pk}'
    cache.delete(detail_cache_key)

@receiver(post_delete, sender=Movie)
def invalidate_movie_cache_on_delete(sender, instance, **kwargs):
    """
    Invalidate relevant caches when a movie is deleted.
    """
    _clear_list_cache()
    detail_cache_key = f'movies:detail:{instance.pk}'
    cache.delete(detail_cache_key)

def _clear_list_cache():
    """
    Helper function to clear list cache.
    Since cache_page generates complex keys, we'll use a simpler approach.
    """
    current_time = int(time.time())
    cache.set('movies:list:version', current_time)
    

# Signal to automatically generate thumbnails when video is uploaded
@receiver(post_save, sender=Movie)
def create_thumbnail_on_video_upload(sender, instance, created, **kwargs):
    """
    Automatically generate thumbnail when a new movie is created 
    or when video file is updated
    """
    # Only trigger for new movies or when video file changes
    if created or (hasattr(instance, '_video_file_changed') and instance._video_file_changed):
        if instance.video_file and not instance.thumbnail:
            print("create_thumbnail_on_video_upload")
            # Use transaction.on_commit to ensure the file is saved before processing
            from django.db import transaction
            transaction.on_commit(lambda: instance.generate_thumbnail_async())


# Track video file changes
@receiver(models.signals.pre_save, sender=Movie)
def track_video_file_changes(sender, instance, **kwargs):
    """Track if video file has changed"""
    if instance.pk:
        try:
            old_instance = Movie.objects.get(pk=instance.pk)
            instance._video_file_changed = old_instance.video_file != instance.video_file
        except Movie.DoesNotExist:
            instance._video_file_changed = False
    else:
        instance._video_file_changed = True
# @receiver(post_save, sender=Movie)
# def generate_thumbnail_on_save(sender, instance, created, **kwargs):
#     if instance.video_file:
#         print(f"File exists: {os.path.exists(instance.video_file.path)}")

#         video_file_path = instance.video_file.name
#         thumbnail_path = instance.thumbnail_path().replace(settings.MEDIA_ROOT, '').lstrip('/')
#         print(video_file_path)
#         print(thumbnail_path)
#         print("to generate")
#         generate_thumbnail.delay(video_file_path, thumbnail_path, movie_id=instance.pk)

# @receiver(post_save, sender=Movie)
# def generate_thumbnail_on_save(sender, instance, created, **kwargs):
#     """
#     Signal handler to generate thumbnail after movie is saved.
#     Only pass serializable data to Celery task.
#     """

#     should_generate = False
    
#     if created and instance.video_file:
#         # New movie with video file
#         should_generate = True
#         print(f"Generating thumbnail for new movie: {instance.pk}")
#     elif not created and instance.video_file:
#         # Check if video file was updated
#         try:
#             old_instance = Movie.objects.get(pk=instance.pk)
#             if old_instance.video_file != instance.video_file:
#                 should_generate = True
#                 print(f"Video file updated for movie {instance.pk}, regenerating thumbnail")
#         except Movie.DoesNotExist:
#             pass
        
#     if not should_generate:
#         return

#     try:
#         video_file_path = instance.video_file.path
#         thumbnail_path = instance.get_thumbnail_path()
        
#         print(f"Video file path: {video_file_path}")
#         print(f"File exists: {os.path.exists(video_file_path)}")
#         print(f"Thumbnail path: {thumbnail_path}")
        
#         # Verify file exists before sending to Celery
#         if os.path.exists(video_file_path):
#             # Add a small delay to ensure file is fully written
#             generate_thumbnail.apply_async(
#                 kwargs={
#                     'video_file_path': video_file_path,
#                     'thumbnail_path': thumbnail_path, 
#                     'movie_id': instance.pk
#                 },
#                 countdown=2  # Wait 2 seconds before processing
#             )
#         else:
#             print(f"Video file does not exist yet: {video_file_path}")
#             # Retry with the alternative method
#             generate_thumbnail_by_id.apply_async(
#                 kwargs={'movie_id': instance.pk},
#                 countdown=5  # Wait 5 seconds and try again
#             )
#     except Exception as e:
#         print(f"Error in signal handler: {e}")
#         # Fallback to ID-based approach
#         generate_thumbnail_by_id.apply_async(
#             kwargs={'movie_id': instance.pk},
#             countdown=5
#         )