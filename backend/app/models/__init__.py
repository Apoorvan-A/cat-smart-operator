"""ORM models. Importing this package registers every table on Base.metadata."""
from app.models.core import (
    Machine,
    Operator,
    OperatorMachineAssignment,
    Shift,
)
from app.models.ops import (
    AuditLog,
    Incident,
    MaintenanceEvent,
    ShiftHandover,
)
from app.models.safety import Alert, ProximityEvent, SafetyEvent
from app.models.task import Task, TaskEvent
from app.models.telemetry import Telemetry, WeatherRecord
from app.models.training import TrainingModule, TrainingRecord

__all__ = [
    "Operator", "Machine", "OperatorMachineAssignment", "Shift",
    "Telemetry", "WeatherRecord",
    "Task", "TaskEvent",
    "SafetyEvent", "Alert", "ProximityEvent",
    "Incident", "MaintenanceEvent", "AuditLog", "ShiftHandover",
    "TrainingModule", "TrainingRecord",
]
