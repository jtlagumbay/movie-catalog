# Movie Platform Fullstack Application
## Tech Stack
1. Frontend
   - Angular
   - Note: A React frontend app was initially created, but migrated to Angular. It is in frontend-react. This can be ignored.
2. Backend
   - Django
   - Celery
   - Redis
   - Postgresql
3. Devops
   - Docker-compose

## Prerequisites
1. Python 3.10+
2. Node.js 16+
3. NPM 10+
4. Docker 20+
5. Docker Compose 2+

## Setup Instructions
1. Clone the repository: `https://github.com/jtlagumbay/movie-catalog`
2. Change directory: `cd movie-catalog`
3. Create .env with following keys:
    ```
    POSTGRES_USER
    POSTGRES_PASSWORD
    POSTGRES_DB
    DB_HOST
    DB_PORT

    # Frontend variables
    VITE_API_URL

    # Backend variables
    DEBUG
    DATABASE_URL
    CORS_ALLOWED_ORIGINS
    DJANGO_SUPERUSER_USERNAME
    DJANGO_SUPERUSER_EMAIL
    DJANGO_SUPERUSER_PASSWORD
    REDIS_URL
    ```
4. Run docker compose: `docker-compose up --build`

## Known Issues and limitations
1. The video streaming is currently not adaptive, but byte-range support was implemented to load videos faster.
2. Thumbnail is generated on celery but currently cannot regenerate new thumbnail for newly updated video file. 
3. The video_file is not properly cached. Updated video may not show right away.
4. UI is not optimized for mobile. 
5. Authentication not yet implemented.
6. Supports MP4 for now. Max size is 100 MB.

## Demo Videos
[Google Drive Link](https://drive.google.com/file/d/1DmUqQn0TD6OiheGwJzHVVniO6DdCSSE6/view?usp=sharing) to the demo.



Let me know any comments and suggestions. Thank you. 
