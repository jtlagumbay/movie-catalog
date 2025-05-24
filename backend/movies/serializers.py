from rest_framework import serializers
from .models import Movie

class MovieSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    video_info = serializers.SerializerMethodField()

    class Meta:
        model = Movie
        fields = ['id', 'title', 'description', 'date_added', 'video_file', 'video_url', 'video_info', 'thumbnail']
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Replace 'video_file' value with what's in 'video_url'
        data['video_file'] = data.pop('video_url')
        return data
    def get_video_url(self, obj):
        if obj.video_file:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.get_streaming_url())
        return None
    
    def get_video_info(self, obj):
        return obj.get_video_info()
    
    def get_video_file_url(self, obj):
        """Get the direct file URL"""
        if obj.video_file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.video_file.url)
            return obj.video_file.url
        return None
    
    def get_thumbnail_url(self, obj):
        """Get thumbnail URL"""
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None
    
    def create(self, validated_data):
        """Custom create method to handle file uploads properly"""
        return Movie.objects.create(**validated_data)
    
    def validate(self, data):
        title = data.get('title')
        instance = self.instance  # None if create, an instance if update
        qs = Movie.objects.filter(title__iexact=title.strip(), is_deleted=False)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError({'title': 'A non-deleted movie with this title already exists.'})
        return data