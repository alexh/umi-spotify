# Makefile for Spotify Player React Project

# Variables
NODE = node
NPM = npm
REACT_SCRIPTS = ./node_modules/.bin/react-scripts

# Default target
.PHONY: all
all: install start

# Install dependencies
.PHONY: install
install:
	@echo "Installing dependencies..."
	@$(NPM) install

# Start development server
.PHONY: start
start:
	@echo "Starting development server..."
	@$(NPM) start

# Build the project
.PHONY: build
build:
	@echo "Building the project..."
	@$(NPM) run build

# Run tests
.PHONY: test
test:
	@echo "Running tests..."
	@$(NPM) test

# Eject from create-react-app
.PHONY: eject
eject:
	@echo "Ejecting from create-react-app..."
	@$(NPM) run eject

# Clean up build artifacts
.PHONY: clean
clean:
	@echo "Cleaning up..."
	@rm -rf build
	@rm -rf node_modules

# Help command to list available targets
.PHONY: help
help:
	@echo "Available targets:"
	@echo "  all      - Install dependencies and start development server (default)"
	@echo "  install  - Install project dependencies"
	@echo "  start    - Start the development server"
	@echo "  build    - Build the project for production"
	@echo "  test     - Run tests"
	@echo "  eject    - Eject from create-react-app"
	@echo "  clean    - Remove build artifacts and node_modules"
	@echo "  help     - Display this help message"
