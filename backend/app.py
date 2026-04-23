if __name__ == "__main__":
    from app.utils.logging import init_logging
    init_logging()

    import uvicorn
    from app.utils.constant import PORT
    uvicorn.run("app.main:app", host="127.0.0.1", port=PORT, reload=True, log_level="warning", access_log=False)
