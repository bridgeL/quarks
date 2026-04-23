import threading
import time


class SnowflakeGenerator:
    def __init__(self, machine_id: int = 1) -> None:
        self.machine_id = machine_id & 0x3FF
        self.sequence = 0
        self.last_timestamp = -1
        self.lock = threading.Lock()
        self.epoch = 1704067200000

    def _current_timestamp(self) -> int:
        return int(time.time() * 1000)

    def _wait_next_millisecond(self, last_timestamp: int) -> int:
        timestamp = self._current_timestamp()
        while timestamp <= last_timestamp:
            timestamp = self._current_timestamp()
        return timestamp

    def generate(self) -> int:
        with self.lock:
            timestamp = self._current_timestamp()
            if timestamp < self.last_timestamp:
                timestamp = self._wait_next_millisecond(self.last_timestamp)
            if timestamp == self.last_timestamp:
                self.sequence = (self.sequence + 1) & 0xFFF
                if self.sequence == 0:
                    timestamp = self._wait_next_millisecond(self.last_timestamp)
            else:
                self.sequence = 0
            self.last_timestamp = timestamp
            return ((timestamp - self.epoch) << 22) | (self.machine_id << 12) | self.sequence


snowflake = SnowflakeGenerator()
