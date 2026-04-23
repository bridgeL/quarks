import sys
from pathlib import Path

from loguru import logger

LOG_DIR = Path(__file__).resolve().parents[2] / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

LOG_ROTATION = "00:00"
LOG_RETENTION = "7 days"
LOG_FORMAT = (
    "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)
CONSOLE_FORMAT = (
    "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{line}</cyan> | "
    "<level>{message}</level>"
)


def init_logging():
    logger.remove()

    logger.add(
        sys.stderr,
        format=CONSOLE_FORMAT,
        level="INFO",
        colorize=True,
    )

    logger.add(
        LOG_DIR / "quarks_{time:YYYY-MM-DD}.log",
        format=LOG_FORMAT,
        level="DEBUG",
        rotation=LOG_ROTATION,
        retention=LOG_RETENTION,
        compression="gz",
        enqueue=True,
        backtrace=True,
        diagnose=True,
    )
