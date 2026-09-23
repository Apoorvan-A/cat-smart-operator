# CAT Smart Operator Assistant — dev shortcuts. Owner: Claude 4.
.PHONY: help up down logs worktrees seed demo-reset test test-backend test-ml test-integration lint

help:
	@echo "up               - docker compose up --build"
	@echo "down             - docker compose down"
	@echo "worktrees        - create the four git worktrees"
	@echo "seed             - seed the database with synthetic demo data"
	@echo "demo-reset       - reseed DB + rewind simulator for a repeatable demo"
	@echo "test             - run all unit test suites"
	@echo "test-integration - run integration tests against the compose stack"
	@echo "lint             - ruff (backend, ml) + eslint (frontend)"

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

worktrees:
	bash scripts/setup-worktrees.sh

seed:
	python scripts/seed.py

demo-reset:
	python scripts/seed.py --reset

test: test-backend test-ml

test-backend:
	cd backend && pytest

test-ml:
	cd ml && pytest

test-integration:
	cd tests/integration && pytest

lint:
	cd backend && ruff check . || true
	cd ml && ruff check . || true
	cd frontend && npm run lint || true
