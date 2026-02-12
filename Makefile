.PHONY: local prod-like down local-prepare prod-like-prepare seed seed-local

SEED_ARGS ?=
PYTHON ?= python3
ALEMBIC ?= $(PYTHON) -m alembic

local:
	./scripts/run-profile.sh local

prod-like:
	./scripts/run-profile.sh prod-like

down:
	./scripts/run-profile.sh down

local-prepare:
	./scripts/run-profile.sh local --prepare-only

prod-like-prepare:
	./scripts/run-profile.sh prod-like --prepare-only

seed:
	$(PYTHON) scripts/seed_test_data.py $(SEED_ARGS)

seed-local: local-prepare
	cd database/migrations && DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres $(ALEMBIC) upgrade head
	$(PYTHON) scripts/seed_test_data.py --env-file backend/.env.local-profile $(SEED_ARGS)
