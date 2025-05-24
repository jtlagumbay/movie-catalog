from django.http import HttpResponse, Http404, HttpResponseNotModified
import os
import re
import mimetypes
from django.core.cache import cache
from django.views import View
from django.shortcuts import get_object_or_404

from rest_framework import generics, status
from rest_framework.response import Response
from .models import Movie
from .serializers import MovieSerializer
from .signals import _clear_list_cache

CACHE_TTL = 60 * 5  # 5 minutes

class MovieListCreateView(generics.ListCreateAPIView):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer

    def get_cache_key(self, request):
        """Generate a consistent cache key for list view."""
        # Include query parameters in cache key for filtering/pagination
        query_string = request.META.get('QUERY_STRING', '')
        return f"movies:list:{hash(query_string)}"

    def get(self, request, *args, **kwargs):
        """List movies with manual caching for better control."""
        cache_key = self.get_cache_key(request)
        
        # Check cache version first
        cache_version = cache.get('movies:list:version', 1)
        versioned_key = f"{cache_key}:v{cache_version}"
        
        cached_response = cache.get(versioned_key)
        if cached_response is not None:
            return Response(cached_response)
        
        # Get fresh data
        response = super().get(request, *args, **kwargs)
        
        # Cache the response data
        cache.set(versioned_key, response.data, CACHE_TTL)
        return response

    def create(self, request, *args, **kwargs):
        """Create movie and invalidate list cache."""
        response = super().create(request, *args, **kwargs)
        
        _clear_list_cache()
        
        return response
    
    def get_serializer_context(self):
        """Add request context to serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class MovieDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Movie.objects.all()
    serializer_class = MovieSerializer

    def get_cache_key(self, movie_id):
        """Generate cache key for detail view."""
        return f"movies:detail:{movie_id}"

    def get(self, request, *args, **kwargs):
        """Retrieve movie with caching."""
        movie_id = kwargs.get('pk')
        cache_key = self.get_cache_key(movie_id)
        
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)
        
        response = super().get(request, *args, **kwargs)
        
        # Cache successful responses
        if response.status_code == 200:
            cache.set(cache_key, response.data, CACHE_TTL)
        
        return response
    
    def update(self, request, *args, **kwargs):
        """Update movie and invalidate caches."""
        partial = True
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        _clear_list_cache()

        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete movie and invalidate caches."""
        instance = self.get_object()
        instance.soft_delete()

        _clear_list_cache()

        return Response({'detail': 'Movie deleted.'}, status=status.HTTP_204_NO_CONTENT)

class VideoStreamingView(View):
    def get(self, request, movie_id):
        movie = get_object_or_404(Movie, pk=movie_id)
        
        if not movie.video_file:
            raise Http404("Video file not found")
        
        file_path = movie.video_file.path
        
        if not os.path.exists(file_path):
            raise Http404("Video file does not exist")
        
        # Get file info
        file_size = os.path.getsize(file_path)
        content_type = mimetypes.guess_type(file_path)[0] or 'video/mp4'
        
        # Handle range requests
        range_header = request.META.get('HTTP_RANGE', '').strip()
        range_match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        
        if range_match:
            first_byte = int(range_match.group(1))
            last_byte = int(range_match.group(2)) if range_match.group(2) else file_size - 1
        else:
            first_byte = 0
            last_byte = file_size - 1
        
        # Validate range
        if first_byte >= file_size:
            return HttpResponse(status=416)  # Range Not Satisfiable
        
        # Ensure last_byte doesn't exceed file size
        last_byte = min(last_byte, file_size - 1)
        content_length = last_byte - first_byte + 1
        
        # Open file and seek to start position
        try:
            with open(file_path, 'rb') as f:
                f.seek(first_byte)
                data = f.read(content_length)
        except IOError:
            raise Http404("Error reading video file")
        
        # Create response
        response = HttpResponse(
            data,
            content_type=content_type,
            status=206 if range_header else 200
        )
        
        # Set headers
        response['Content-Length'] = str(content_length)
        response['Accept-Ranges'] = 'bytes'
        
        if range_header:
            response['Content-Range'] = f'bytes {first_byte}-{last_byte}/{file_size}'
        
        # # Cache headers
        # response['Cache-Control'] = 'public, max-age=3600'
        # response['ETag'] = f'"{hash(file_path + str(os.path.getmtime(file_path)))}"'
        
        return response
