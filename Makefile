.PHONY: local prod-like down local-prepare prod-like-prepare

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
