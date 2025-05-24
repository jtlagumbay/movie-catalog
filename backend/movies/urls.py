from django.urls import path
from .views import MovieListCreateView, MovieDetailView, VideoStreamingView

urlpatterns = [
    path('movies/', MovieListCreateView.as_view(), name='movie-list-create'),
    path('movies/<int:pk>/', MovieDetailView.as_view(), name='movie-detail'),
    path('stream/video/<int:movie_id>/', VideoStreamingView.as_view(), name='video_stream'),

]
