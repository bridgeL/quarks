if __name__ == "__main__":
    import uvicorn
    from app.utils.constant import PORT
    uvicorn.run("app.main:app", host="127.0.0.1", port=PORT, reload=True)
