import os
import sys
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb+srv://Mohan:Mohan7983@mohan.bnwereo.mongodb.net/campus_rides"
)

# ── Connect ───────────────────────────────────────────────────────
try:
    client = MongoClient(
        MONGO_URI,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=10000,
        socketTimeoutMS=10000,
        tls=True,
        tlsAllowInvalidCertificates=True
    )
    client.admin.command('ping')
    print("[OK] MongoDB Atlas connected successfully!")

except (ConnectionFailure, ServerSelectionTimeoutError) as e:
    print(f"[ERROR] MongoDB Atlas connection failed: {e}")
    sys.exit(1)

except Exception as e:
    print(f"[ERROR] Unexpected DB error: {e}")
    sys.exit(1)

# ── Database ──────────────────────────────────────────────────────
db = client["campus_rides"]

# ── Collections ───────────────────────────────────────────────────
users_collection          = db["users"]
rides_collection          = db["rides"]
ride_requests_collection  = db["ride_requests"]
ride_otp_collection       = db["ride_otp"]
ride_history_collection   = db["ride_history"]

# ── Indexes ───────────────────────────────────────────────────────
try:
    users_collection.create_index("email", unique=True)
    rides_collection.create_index("driver_id")
    rides_collection.create_index("status")
    ride_requests_collection.create_index("ride_id")
    ride_requests_collection.create_index("passenger_id")
    ride_otp_collection.create_index("ride_id")
    ride_otp_collection.create_index("passenger_id")
    ride_history_collection.create_index("ride_id")
    ride_history_collection.create_index("driver_id")
    ride_history_collection.create_index("passenger_id")
    print("[OK] MongoDB indexes ready.")
except Exception as e:
    print(f"[WARN] Index note (safe to ignore): {e}")