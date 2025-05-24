# Setup

## Requirements
Python 3.10
## Steps

1. `chmod +x setup.sh` 
2. source ./setup.sh

# Start the container (if using docker-compose)
docker-compose up -d

# Connect to the database
docker exec -it postgres-db psql -U movie_user -d movie_db

# View logs
docker logs postgres-db

# Stop the container
docker stop postgres-db

# Remove the container
docker rm postgres-db

# Backup database
docker exec postgres-db pg_dump -U myuser mydatabase > backup.sql

# Restore database
docker exec -i postgres-db psql -U myuser -d mydatabase < backup.sql

# Stop everything and clean up
docker-compose down -v
docker system prune -f

# Remove any existing containers
docker rm -f $(docker ps -aq) 2>/dev/null || true

# Rebuild and start
docker-compose build --no-cache
docker-compose up

# running script while docker is running
docker exec -it 8efa03609505 bash

npm install -g @angular/cli