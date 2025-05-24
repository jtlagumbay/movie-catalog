#!/bin/bash

# docker-entrypoint.sh - Django startup script

set -e  # Exit on any error

echo "Starting Django application..."

# Function to wait for PostgreSQL
wait_for_postgres() {
    echo "Waiting for PostgreSQL to be ready..."
    
    # Extract database connection details from DATABASE_URL or use defaults
    DB_HOST=${DB_HOST:-postgres}
    DB_PORT=${DB_PORT:-5432}
    
    # Wait for PostgreSQL using netcat
    while ! nc -z "$DB_HOST" "$DB_PORT"; do
        echo "PostgreSQL is unavailable - sleeping for 1 second"
        sleep 1
    done
    
    echo "PostgreSQL is up and running!"
}

# Function to run database migrations
run_migrations() {
    echo "Running database migrations..."
    python manage.py migrate --noinput
    
    if [ $? -eq 0 ]; then
        echo "Migrations completed successfully"
    else
        echo "Migration failed!"
        exit 1
    fi
}

# Function to collect static files
collect_static() {
    echo "Collecting static files..."
    python manage.py collectstatic --noinput --clear
    
    if [ $? -eq 0 ]; then
        echo "Static files collected successfully"
    else
        echo "Static file collection failed!"
        exit 1
    fi
}

# Function to create superuser (optional)
create_superuser() {
    echo "Checking for superuser..."
    
    # Only create if environment variables are set
    if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
        python manage.py shell << EOF
import os
from django.contrib.auth import get_user_model

User = get_user_model()
username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
email = os.environ.get('DJANGO_SUPERUSER_EMAIL')
password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')

if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, email, password)
    print(f'Superuser {username} created successfully')
else:
    print(f'Superuser {username} already exists')
EOF
    else
        echo "Superuser environment variables not set, skipping superuser creation"
    fi
}

# Function to load initial data (optional)
load_fixtures() {
    if [ -d "fixtures" ] && [ "$(ls -A fixtures/*.json 2>/dev/null)" ]; then
        echo "Loading initial data fixtures..."
        for fixture in fixtures/*.json; do
            echo "Loading fixture: $fixture"
            python manage.py loaddata "$fixture"
        done
    else
        echo "No fixtures found, skipping initial data load"
    fi
}

# Main execution flow
main() {

    # Always wait for database
    wait_for_postgres
    
    # Run migrations
    run_migrations
    
    # Collect static files (skip in development if DEBUG=1)
    if [ "$DEBUG" != "1" ]; then
        collect_static
    fi
    
    # Create superuser if requested
    create_superuser
    
    # Load fixtures if available
    load_fixtures
    
    echo "Django initialization complete!"
    echo "Starting application with command: $@"
    
    # Execute the main command (passed as arguments)
    exec "$@"
}

# Run main function
main "$@"