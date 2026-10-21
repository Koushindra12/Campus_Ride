from datetime import datetime


def create_user(name, email, password_hash,
                phone="", department="",
                vehicle_type="no_vehicle",
                profile_photo="",
                email_type="personal"):
    return {
        "name":                name,
        "email":               email,
        "email_type":          email_type,
        "password":            password_hash,
        "phone":               phone,
        "department":          department,
        "vehicle_type":        vehicle_type,
        "profile_photo":       profile_photo,
        "role":                "passenger" if vehicle_type == "no_vehicle" else "driver",
        "is_profile_complete": False,
        "is_available":        True,
        "created_at":          datetime.utcnow()
    }


def create_ride(driver_id, start_location, destination,
                lat, lng, dest_lat, dest_lng,
                ride_datetime, seats, price):
    return {
        "driver_id":       str(driver_id),
        "start_location":  start_location,
        "destination":     destination,
        "start_lat":       float(lat),
        "start_lng":       float(lng),
        "dest_lat":        float(dest_lat),
        "dest_lng":        float(dest_lng),
        "datetime":        ride_datetime,
        "seats":           int(seats),
        "available_seats": int(seats),
        "price":           float(price),
        "status":          "active",
        "created_at":      datetime.utcnow()
    }


def create_ride_request(ride_id, passenger_id):
    return {
        "ride_id":      str(ride_id),
        "passenger_id": str(passenger_id),
        "status":       "pending",
        "requested_at": datetime.utcnow()
    }


def create_otp_record(ride_id, passenger_id, otp):
    """OTP tied to both ride_id and passenger_id for multi-seat rides."""
    return {
        "ride_id":      str(ride_id),
        "passenger_id": str(passenger_id),
        "otp":          str(otp),
        "verified":     False,
        "created_at":   datetime.utcnow()
    }


def create_ride_history(ride_id, driver_id, passenger_id):
    return {
        "ride_id":      str(ride_id),
        "driver_id":    str(driver_id),
        "passenger_id": str(passenger_id),
        "start_time":   datetime.utcnow(),
        "end_time":     None,
        "status":       "ongoing"
    }