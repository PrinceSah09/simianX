"""In-memory experiment repository."""

from uuid import UUID

from app.models.experiment import Experiment


class InMemoryExperimentRepository:
    def __init__(self) -> None:
        self._store: dict[UUID, Experiment] = {}

    def save(self, experiment: Experiment) -> Experiment:
        self._store[experiment.id] = experiment
        return experiment

    def get_by_id(self, experiment_id: UUID) -> Experiment | None:
        return self._store.get(experiment_id)

    def get_active(self) -> Experiment | None:
        """Return the currently running experiment, if any."""
        for exp in self._store.values():
            if exp.status == "running":
                return exp
        return None

    def list_recent(self, limit: int = 20) -> list[Experiment]:
        """Return recently created experiments, newest first."""
        items = list(self._store.values())
        items.sort(key=lambda x: x.created_at, reverse=True)
        return items[:limit]

    def clear(self) -> None:
        """Used in test fixtures to reset store between runs."""
        self._store.clear()
