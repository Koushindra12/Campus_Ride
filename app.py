import os
import sys

# Fix module import paths
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, render_template, session
from flask_socketio import SocketIO, emit, join_room, leave_room
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ── Flask App ─────────────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'campus_rides_secret_2024')
app.config['SESSION_COOKIE_SECURE']   = False
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# ── SocketIO (threading — no eventlet needed) ─────────────────────
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode='threading',
    logger=False,
    engineio_logger=False
)

# ── Database ──────────────────────────────────────────────────────
from database.mongodb_connection import db

# ── Blueprints ────────────────────────────────────────────────────
from routes.auth    import auth_bp
from routes.rides   import rides_bp
from routes.profile import profile_bp

app.register_blueprint(auth_bp)
app.register_blueprint(rides_bp)
app.register_blueprint(profile_bp)


# =================================================================
#  SOCKET.IO EVENTS
# =================================================================

@socketio.on('connect')
def handle_connect():
    if 'user_id' in session:
        join_room(session['user_id'])
        print(f"[SOCKET] {session.get('user_name','?')} connected -> room {session['user_id']}")
    emit('connected', {'message': 'Connected to Campus Rides!'})


@socketio.on('disconnect')
def handle_disconnect():
    print(f"[SOCKET] {session.get('user_name','?')} disconnected")


@socketio.on('join_room')
def handle_join_room(data):
    room = data.get('room')
    if room:
        join_room(room)
        emit('room_joined', {'room': room})


@socketio.on('leave_room')
def handle_leave_room(data):
    room = data.get('room')
    if room:
        leave_room(room)
        emit('room_left', {'room': room})


@socketio.on('join_ride_room')
def handle_join_ride_room(data):
    ride_id = data.get('ride_id')
    if ride_id:
        join_room(f'ride_{ride_id}')
        emit('ride_room_joined', {'ride_id': ride_id})


@socketio.on('driver_location_update')
def handle_driver_location(data):
    ride_id = data.get('ride_id')
    lat     = data.get('lat')
    lng     = data.get('lng')
    if ride_id and lat and lng:
        emit('driver_location_update', {
            'ride_id':     ride_id,
            'lat':         lat,
            'lng':         lng,
            'driver_name': session.get('user_name', 'Driver')
        }, room=f'ride_{ride_id}', include_self=False)


@socketio.on('new_ride_notification')
def handle_new_ride(data):
    emit('new_ride_notification', data, broadcast=True, include_self=False)


@socketio.on('ride_request_alert')
def handle_ride_request(data):
    driver_id = data.get('driver_id')
    if driver_id:
        emit('ride_request_alert', data, room=driver_id)


@socketio.on('ride_accept_update')
def handle_ride_accept(data):
    passenger_id = data.get('passenger_id')
    if passenger_id:
        emit('ride_accept_update', data, room=passenger_id)


@socketio.on('ride_reject_update')
def handle_ride_reject(data):
    passenger_id = data.get('passenger_id')
    if passenger_id:
        emit('ride_reject_update', data, room=passenger_id)


@socketio.on('ride_started')
def handle_ride_started(data):
    ride_id = data.get('ride_id')
    if ride_id:
        emit('ride_started', data, room=f'ride_{ride_id}', broadcast=True)


@socketio.on('ride_completed')
def handle_ride_completed(data):
    ride_id = data.get('ride_id')
    if ride_id:
        emit('ride_completed', data, broadcast=True)


@socketio.on('emergency_alert')
def handle_emergency(data):
    user_name = session.get('user_name', 'Unknown')
    ride_id   = data.get('ride_id')
    lat       = data.get('lat')
    lng       = data.get('lng')
    print(f"[EMERGENCY] From {user_name} | Ride: {ride_id} | Location: {lat},{lng}")
    emit('emergency_alert', {
        'user_name': user_name,
        'ride_id':   ride_id,
        'lat':       lat,
        'lng':       lng,
        'message':   f'EMERGENCY alert from {user_name}!'
    }, broadcast=True)


# =================================================================
#  ERROR HANDLERS
# =================================================================

@app.errorhandler(404)
def not_found(e):
    return render_template('404.html'), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('500.html'), 500

@app.errorhandler(403)
def forbidden(e):
    return render_template('403.html'), 403


# =================================================================
#  CONTEXT PROCESSOR
# =================================================================

@app.context_processor
def inject_user():
    return dict(
        current_user_id   = session.get('user_id'),
        current_user_name = session.get('user_name'),
        current_user_role = session.get('user_role'),
        current_vehicle   = session.get('vehicle_type'),
        map_tile_url      = os.getenv(
            'MAP_TILE_URL',
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        )
    )


# =================================================================
#  RUN
# =================================================================

if __name__ == '__main__':
    print("=" * 55)
    print("  Campus Ride Sharing System")
    print("  SocketIO  -> threading mode")
    print("  MongoDB   -> Atlas cloud")
    print("  Server    -> http://localhost:5000")
    print("=" * 55)
    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=True,
        use_reloader=False
    )