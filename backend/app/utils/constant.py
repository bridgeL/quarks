import os

from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT"))
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24
