.PHONY: help install backend frontend migrate seed test lint up down

help:
	@echo "make install   Install backend and frontend dependencies"
	@echo "make migrate   Create and apply database migrations"
	@echo "make seed      Create the demo account (demo@folio.ma)"
	@echo "make backend   Run Django on :8000"
	@echo "make frontend  Run Vite on :5173"
	@echo "make test      Run the backend test suite"
	@echo "make lint      Lint backend (ruff) and frontend (eslint)"
	@echo "make up        Start the full Docker stack on :8080"

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

migrate:
	cd backend && python manage.py makemigrations accounts documents chat quizzes flashcards notes planner support
	cd backend && python manage.py migrate

seed:
	cd backend && python manage.py seed_demo

backend:
	cd backend && python manage.py runserver

frontend:
	cd frontend && npm run dev

test:
	cd backend && pytest

lint:
	cd backend && ruff check .
	cd frontend && npm run lint

up:
	docker compose up --build

down:
	docker compose down
