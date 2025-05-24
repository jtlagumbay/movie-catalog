from django.contrib import admin
from .models import Movie

@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'date_added', 'date_updated', 'is_deleted')
    list_filter = ('id', 'title', 'date_added', 'date_updated', 'is_deleted')
    search_fields = ('title', 'description')

    def get_queryset(self, request):
        return Movie.all_objects.all()