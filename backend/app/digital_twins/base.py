from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseDigitalTwin(ABC):
    def __init__(self, twin_name: str):
        self.twin_name = twin_name
        self.current_state: Dict[str, Any] = {}

    @abstractmethod
    async def process_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Processes incoming Kafka telemetry events and computes updated digital twin state."""
        pass

    @abstractmethod
    def get_state((self)) -> Dict[str, Any]:
        """Returns the current state dictionary of the digital twin."""
        return self.current_state
