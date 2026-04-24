if __name__ == "__main__":
    from loguru import logger

    from app.utils.logging import init_logging
    init_logging()

    import uvicorn
    from app.utils.constant import PORT

    host = "127.0.0.1"
    logger.info(f"Backend server running at http://{host}:{PORT}")
    uvicorn.run("app.main:app", host=host, port=PORT, reload=True, log_level="warning", access_log=False)
