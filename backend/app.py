import os

import uvicorn
from dotenv import load_dotenv

from app.main import app

load_dotenv()


if __name__ == "__main__":
    port = int(os.getenv("PORT"))
    uvicorn.run(app, host="127.0.0.1", port=port)
