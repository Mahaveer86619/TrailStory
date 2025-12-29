.PHONY: clean start rebuild logs setup-s3

# Stops containers and removes volumes (clears DB and LocalStack data)
clean:
	@echo "Cleaning containers and volumes..."
	docker compose down -v

# Standard build and start
start:
	@echo "Starting TrailStory..."
	docker compose up --build
	@echo "Services are starting. Use 'make logs' to follow output."

# Full reset: clean then start
rebuild: clean start

# Follow logs from the server container
logs:
	docker compose logs -f server

# Helper to create the bucket in LocalStack manually if needed
setup-s3:
	@echo "Creating S3 bucket in LocalStack..."
	docker exec localstack awslocal s3 mb s3://trailstory-media