import os
import random
from datetime import datetime

import requests
from bson import ObjectId
from flask import (Blueprint, flash, jsonify, redirect,
                   render_template, request, session, url_for)

from database.mongodb_connection import (
    ride_history_collection, ride_otp_collection,
    ride_requests_collection, rides_collection,
    users_collection
)
from models.models import (
    create_otp_record, create_ride,
    create_ride_history, create_ride_request
)
from routes.auth import login_required

rides_bp = Blueprint('rides', __name__)


# ═════════════════════════════════════════════════════════════════
#  HELPERS
# ═════════════════════════════════════════════════════════════════

def send_otp_fast2sms(phone, otp):
    api_key = os.getenv('FAST2SMS_API_KEY', '')
    if not api_key or api_key == 'your_fast2sms_api_key_here':
        print(f"[DEMO] OTP for {phone}: {otp}")
        return {"return": True, "demo": True}
    url     = "https://www.fast2sms.com/dev/bulkV2"
    payload = {
        "route":            "otp",
        "variables_values": str(otp),
        "numbers":          str(phone),
    }
    headers = {
        "authorization":  api_key,
        "Content-Type":   "application/json"
    }
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        return resp.json()
    except Exception as e:
        print(f"[WARN] OTP send error: {e}")
        return {"return": False}


def geocode_location(address):
    api_key = os.getenv('OPENCAGE_API_KEY', '')
    if not api_key or api_key == 'your_opencage_api_key_here':
        print(f"[DEMO] Geocoding skipped for: {address}")
        return 29.9600, 77.5550
    url = (
        f"https://api.opencagedata.com/geocode/v1/json"
        f"?q={requests.utils.quote(address)}&key={api_key}&limit=1"
    )
    try:
        resp = requests.get(url, timeout=10)
        data = resp.json()
        if data.get('results'):
            lat = data['results'][0]['geometry']['lat']
            lng = data['results'][0]['geometry']['lng']
            return float(lat), float(lng)
    except Exception as e:
        print(f"[WARN] Geocode error: {e}")
    return 29.9600, 77.5550


# ═════════════════════════════════════════════════════════════════
#  OFFER RIDE
# ═════════════════════════════════════════════════════════════════

@rides_bp.route('/offer-ride', methods=['GET', 'POST'])
@login_required
def offer_ride():
    user = users_collection.find_one({'_id': ObjectId(session['user_id'])})

    if user.get('vehicle_type', 'no_vehicle') == 'no_vehicle':
        flash('Only drivers with a vehicle can offer rides.', 'error')
        return redirect(url_for('auth.dashboard'))

    if request.method == 'POST':
        start_location = request.form.get('start_location', '').strip()
        destination    = request.form.get('destination', '').strip()
        ride_date      = request.form.get('ride_date', '').strip()
        ride_time      = request.form.get('ride_time', '').strip()
        seats          = request.form.get('seats', 1)
        price          = request.form.get('price', 25)

        if not all([start_location, destination, ride_date, ride_time]):
            flash('Please fill all required fields.', 'error')
            return render_template('offer_ride.html', user=user)

        # ── Block: only one active ride at a time ─────────────────
        existing_active = rides_collection.find_one({
            'driver_id': session['user_id'],
            'status': {'$in': ['active', 'ongoing']}
        })
        if existing_active:
            flash('⚠️ You already have an active ride. Complete or cancel it first.', 'error')
            return render_template('offer_ride.html', user=user)

        try:
            ride_datetime = datetime.strptime(
                f"{ride_date} {ride_time}", "%Y-%m-%d %H:%M"
            )
        except ValueError:
            flash('Invalid date or time format.', 'error')
            return render_template('offer_ride.html', user=user)

        start_lat, start_lng = geocode_location(start_location)
        dest_lat,  dest_lng  = geocode_location(destination)

        ride_data = create_ride(
            driver_id=session['user_id'],
            start_location=start_location,
            destination=destination,
            lat=start_lat, lng=start_lng,
            dest_lat=dest_lat, dest_lng=dest_lng,
            ride_datetime=ride_datetime,
            seats=seats,
            price=price
        )
        result  = rides_collection.insert_one(ride_data)
        ride_id = str(result.inserted_id)

        # Real-time broadcast to all passengers
        from app import socketio
        socketio.emit('new_ride_notification', {
            'ride_id':        ride_id,
            'driver_name':    user['name'],
            'start_location': start_location,
            'destination':    destination,
            'seats':          int(seats),
            'price':          str(price),
            'datetime':       ride_datetime.strftime("%d %b %Y, %I:%M %p")
        }, namespace='/')

        flash('🎉 Ride created! Students have been notified.', 'success')
        return redirect(url_for('auth.dashboard'))

    return render_template('offer_ride.html', user=user)


# ═════════════════════════════════════════════════════════════════
#  FIND RIDE
# ═════════════════════════════════════════════════════════════════

@rides_bp.route('/find-ride')
@login_required
def find_ride():
    user  = users_collection.find_one({'_id': ObjectId(session['user_id'])})
    rides = list(
        rides_collection.find(
            {'status': 'active', 'available_seats': {'$gt': 0}}
        ).sort('datetime', 1)
    )
    rides_data = []
    for ride in rides:
        driver = users_collection.find_one({'_id': ObjectId(ride['driver_id'])})
        ride['_id']            = str(ride['_id'])
        ride['driver_name']    = driver['name']          if driver else 'Unknown'
        ride['driver_phone']   = driver.get('phone','')  if driver else ''
        ride['driver_vehicle'] = driver.get('vehicle_type','') if driver else ''

        if isinstance(ride.get('datetime'), datetime):
            ride['datetime_str'] = ride['datetime'].strftime("%d %b %Y, %I:%M %p")
        else:
            ride['datetime_str'] = str(ride.get('datetime', ''))

        existing_req = ride_requests_collection.find_one({
            'ride_id':      ride['_id'],
            'passenger_id': session['user_id']
        })
        ride['already_requested'] = existing_req is not None
        ride['req_status'] = existing_req.get('status', '') if existing_req else ''
        rides_data.append(ride)

    return render_template('find_ride.html', user=user, rides=rides_data)


# ═════════════════════════════════════════════════════════════════
#  REQUEST RIDE
# ═════════════════════════════════════════════════════════════════

@rides_bp.route('/request-ride/<ride_id>', methods=['POST'])
@login_required
def request_ride(ride_id):
    ride = rides_collection.find_one({'_id': ObjectId(ride_id)})
    if not ride:
        return jsonify({'success': False, 'message': 'Ride not found'}), 404

    if ride['available_seats'] <= 0:
        return jsonify({'success': False, 'message': 'No seats available'}), 400

    # Block: only one active accepted/pending request at a time
    active_req = ride_requests_collection.find_one({
        'passenger_id': session['user_id'],
        'status': {'$in': ['pending', 'accepted']}
    })
    if active_req:
        return jsonify({'success': False, 'message': 'You already have an active ride request. Wait for it to complete.'}), 400

    existing = ride_requests_collection.find_one({
        'ride_id':      ride_id,
        'passenger_id': session['user_id']
    })
    if existing:
        return jsonify({'success': False, 'message': 'You already requested this ride'}), 400

    req_data  = create_ride_request(ride_id=ride_id, passenger_id=session['user_id'])
    result    = ride_requests_collection.insert_one(req_data)
    passenger = users_collection.find_one({'_id': ObjectId(session['user_id'])})

    # Notify driver via SocketIO
    from app import socketio
    socketio.emit('ride_request_alert', {
        'request_id':      str(result.inserted_id),
        'ride_id':         ride_id,
        'passenger_name':  passenger['name'],
        'passenger_phone': passenger.get('phone', ''),
        'destination':     ride['destination'],
        'driver_id':       ride['driver_id']
    }, room=ride['driver_id'], namespace='/')

    return jsonify({'success': True, 'message': 'Ride request sent to driver!'})


# ═════════════════════════════════════════════════════════════════
#  ACCEPT RIDE (Driver → generates OTP → notifies passenger)
# ═════════════════════════════════════════════════════════════════

@rides_bp.route('/accept-ride/<request_id>', methods=['POST'])
@login_required
def accept_ride(request_id):
    ride_request = ride_requests_collection.find_one({'_id': ObjectId(request_id)})
    if not ride_request:
        return jsonify({'success': False, 'message': 'Request not found'}), 404

    ride = rides_collection.find_one({'_id': ObjectId(ride_request['ride_id'])})
    if not ride or str(ride['driver_id']) != session['user_id']:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    if ride_request.get('status') != 'pending':
        return jsonify({'success': False, 'message': 'Request already processed'}), 400

    # Update request status
    ride_requests_collection.update_one(
        {'_id': ObjectId(request_id)},
        {'$set': {'status': 'accepted', 'accepted_at': datetime.utcnow()}}
    )

    # Decrease available seats
    rides_collection.update_one(
        {'_id': ObjectId(ride_request['ride_id'])},
        {'$inc': {'available_seats': -1}}
    )

    # Generate + store OTP (keyed by ride_id + passenger_id)
    otp = random.randint(100000, 999999)
    ride_otp_collection.delete_many({
        'ride_id':      ride_request['ride_id'],
        'passenger_id': ride_request['passenger_id']
    })
    otp_data = create_otp_record(
        ride_id=ride_request['ride_id'],
        passenger_id=ride_request['passenger_id'],
        otp=otp
    )
    ride_otp_collection.insert_one(otp_data)

    # Send OTP via SMS
    passenger = users_collection.find_one({'_id': ObjectId(ride_request['passenger_id'])})
    if passenger and passenger.get('phone'):
        send_otp_fast2sms(passenger['phone'], otp)

    driver = users_collection.find_one({'_id': ObjectId(session['user_id'])})

    # Notify passenger instantly via SocketIO
    from app import socketio
    socketio.emit('ride_accept_update', {
        'ride_id':       ride_request['ride_id'],
        'request_id':    request_id,
        'otp':           str(otp),
        'driver_name':   driver['name'] if driver else 'Driver',
        'driver_phone':  driver.get('phone', '') if driver else '',
        'start_location': ride.get('start_location', ''),
        'destination':   ride.get('destination', ''),
        'message':       f"✅ Your ride was accepted by {driver['name'] if driver else 'Driver'}! OTP: {otp}"
    }, room=ride_request['passenger_id'], namespace='/')

    return jsonify({'success': True, 'message': 'Ride accepted and OTP sent to passenger!'})


# ═════════════════════════════════════════════════════════════════
#  REJECT RIDE (Driver → notifies passenger immediately)
# ═════════════════════════════════════════════════════════════════

@rides_bp.route('/reject-ride/<request_id>', methods=['POST'])
@login_required
def reject_ride(request_id):
    ride_request = ride_requests_collection.find_one({'_id': ObjectId(request_id)})
    if not ride_request:
        return jsonify({'success': False, 'message': 'Request not found'}), 404

    ride = rides_collection.find_one({'_id': ObjectId(ride_request['ride_id'])})
    if not ride or str(ride['driver_id']) != session['user_id']:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    ride_requests_collection.update_one(
        {'_id': ObjectId(request_id)},
        {'$set': {'status': 'rejected', 'rejected_at': datetime.utcnow()}}
    )

    driver = users_collection.find_one({'_id': ObjectId(session['user_id'])})

    # Notify passenger instantly via SocketIO
    from app import socketio
    socketio.emit('ride_reject_update', {
        'ride_id':     ride_request['ride_id'],
        'request_id':  request_id,
        'driver_name': driver['name'] if driver else 'Driver',
        'message':     f"❌ Your ride request was rejected by {driver['name'] if driver else 'the driver'}."
    }, room=ride_request['passenger_id'], namespace='/')

    return jsonify({'success': True, 'message': 'Ride rejected and passenger notified.'})


# ═════════════════════════════════════════════════════════════════
#  VERIFY OTP  (Driver verifies passenger OTP → starts ride)
# ═════════════════════════════════════════════════════════════════

@rides_bp.route('/verify-otp/<ride_id>', methods=['POST'])
@login_required
def verify_otp(ride_id):
    entered_otp = request.form.get('otp', '').strip()

    # Find OTP for this ride (not yet verified)
    otp_record = ride_otp_collection.find_one(
        {'ride_id': ride_id, 'verified': False}
    )

    if not otp_record:
        return jsonify({'success': False, 'message': 'OTP not found or already used.'}), 404

    if str(otp_record['otp']) == str(entered_otp):
        ride_otp_collection.update_one(
            {'_id': otp_record['_id']},
            {'$set': {'verified': True, 'verified_at': datetime.utcnow()}}
        )
        rides_collection.update_one(
            {'_id': ObjectId(ride_id)},
            {'$set': {'status': 'ongoing'}}
        )

        # Save ride history
        ride     = rides_collection.find_one({'_id': ObjectId(ride_id)})
        ride_req = ride_requests_collection.find_one(
            {'ride_id': ride_id, 'status': 'accepted'}
        )
        if ride and ride_req:
            history = create_ride_history(
                ride_id, ride['driver_id'], ride_req['passenger_id']
            )
            ride_history_collection.insert_one(history)

        # Broadcast ride started
        from app import socketio
        socketio.emit('ride_started', {
            'ride_id': ride_id,
            'message': '🚀 Ride has started! Have a safe journey.'
        }, namespace='/')

        return jsonify({
            'success':  True,
            'message':  'OTP verified! Ride started.',
            'redirect': url_for('rides.live_ride', ride_id=ride_id)
        })

    return jsonify({'success': False, 'message': 'Invalid OTP. Please try again.'}), 400


# ═════════════════════════════════════════════════════════════════
#  LIVE RIDE
# ═════════════════════════════════════════════════════════════════

@rides_bp.route('/live-ride/<ride_id>')
@login_required
def live_ride(ride_id):
    ride = rides_collection.find_one({'_id': ObjectId(ride_id)})
    if not ride:
        flash('Ride not found.', 'error')
        return redirect(url_for('auth.dashboard'))

    ride['_id']  = str(ride['_id'])
    driver       = users_collection.find_one({'_id': ObjectId(ride['driver_id'])})
    user         = users_collection.find_one({'_id': ObjectId(session['user_id'])})
    map_tile_url = os.getenv(
        'MAP_TILE_URL',
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    )
    return render_template(
        'ride_live.html',
        ride=ride,
        driver=driver,
        user=user,
        map_tile_url=map_tile_url
    )


# ═════════════════════════════════════════════════════════════════
#  COMPLETE RIDE
# ═════════════════════════════════════════════════════════════════

@rides_bp.route('/complete-ride/<ride_id>', methods=['POST'])
@login_required
def complete_ride(ride_id):
    ride = rides_collection.find_one({'_id': ObjectId(ride_id)})
    if not ride:
        return jsonify({'success': False, 'message': 'Ride not found'}), 404
    if str(ride['driver_id']) != session['user_id']:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    rides_collection.update_one(
        {'_id': ObjectId(ride_id)},
        {'$set': {'status': 'completed'}}
    )
    ride_history_collection.update_many(
        {'ride_id': ride_id, 'status': 'ongoing'},
        {'$set': {'status': 'completed', 'end_time': datetime.utcnow()}}
    )

    from app import socketio
    socketio.emit('ride_completed', {
        'ride_id': ride_id,
        'message': '🏁 Ride completed successfully!'
    }, namespace='/')

    return jsonify({'success': True, 'message': 'Ride completed!'})


# ═════════════════════════════════════════════════════════════════
#  CANCEL RIDE
# ═════════════════════════════════════════════════════════════════

@rides_bp.route('/cancel-ride/<ride_id>', methods=['POST'])
@login_required
def cancel_ride(ride_id):
    ride = rides_collection.find_one({'_id': ObjectId(ride_id)})
    if not ride:
        return jsonify({'success': False, 'message': 'Ride not found'}), 404
    if str(ride['driver_id']) != session['user_id']:
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    rides_collection.update_one(
        {'_id': ObjectId(ride_id)},
        {'$set': {'status': 'cancelled'}}
    )

    from app import socketio
    socketio.emit('ride_cancelled', {
        'ride_id': ride_id,
        'message': '⚠️ Ride has been cancelled by the driver.'
    }, namespace='/')

    return jsonify({'success': True, 'message': 'Ride cancelled.'})


# ═════════════════════════════════════════════════════════════════
#  RIDE REQUESTS PAGE (Driver view — real-time AJAX)
# ═════════════════════════════════════════════════════════════════

@rides_bp.route('/ride-requests')
@login_required
def ride_requests_page():
    user     = users_collection.find_one({'_id': ObjectId(session['user_id'])})
    my_rides = list(rides_collection.find({
        'driver_id': session['user_id'],
        'status':    {'$in': ['active', 'ongoing']}
    }))

    requests_data = []
    for ride in my_rides:
        reqs = list(ride_requests_collection.find({
            'ride_id': str(ride['_id']),
            'status':  'pending'
        }))
        for req in reqs:
            passenger = users_collection.find_one({'_id': ObjectId(req['passenger_id'])})
            requests_data.append({
                'request_id':      str(req['_id']),
                'ride_id':         str(ride['_id']),
                'passenger_name':  passenger['name'] if passenger else 'Unknown',
                'passenger_phone': passenger.get('phone','') if passenger else '',
                'start_location':  ride['start_location'],
                'destination':     ride['destination'],
                'datetime_str': (
                    ride['datetime'].strftime("%d %b %Y, %I:%M %p")
                    if isinstance(ride.get('datetime'), datetime)
                    else str(ride.get('datetime',''))
                ),
                'status': req['status']
            })

    return render_template(
        'ride_requests.html',
        user=user,
        requests=requests_data
    )


# ═════════════════════════════════════════════════════════════════
#  DELETE RIDE HISTORY (one by one)
# ═════════════════════════════════════════════════════════════════

@rides_bp.route('/delete-history/<history_id>', methods=['POST'])
@login_required
def delete_history(history_id):
    record = ride_history_collection.find_one({'_id': ObjectId(history_id)})
    if not record:
        return jsonify({'success': False, 'message': 'Record not found'}), 404

    # Ensure the current user owns this record
    if (str(record.get('driver_id')) != session['user_id'] and
            str(record.get('passenger_id')) != session['user_id']):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403

    ride_history_collection.delete_one({'_id': ObjectId(history_id)})
    return jsonify({'success': True, 'message': 'History record deleted.'})


# ═════════════════════════════════════════════════════════════════
#  MY RIDE HISTORY (JSON API)
# ═════════════════════════════════════════════════════════════════

@rides_bp.route('/api/my-history')
@login_required
def api_my_history():
    history = list(
        ride_history_collection.find({
            '$or': [
                {'driver_id':    session['user_id']},
                {'passenger_id': session['user_id']}
            ]
        }).sort('start_time', -1).limit(20)
    )
    result = []
    for h in history:
        h['_id'] = str(h['_id'])
        ride = rides_collection.find_one({'_id': ObjectId(h['ride_id'])}) if h.get('ride_id') else None
        result.append({
            'id':             h['_id'],
            'ride_id':        h.get('ride_id', ''),
            'start_location': ride.get('start_location', 'N/A') if ride else 'N/A',
            'destination':    ride.get('destination', 'N/A') if ride else 'N/A',
            'status':         h.get('status', 'completed'),
            'role':           'Driver' if h.get('driver_id') == session['user_id'] else 'Passenger',
            'start_time':     h['start_time'].strftime("%d %b %Y, %I:%M %p") if h.get('start_time') else 'N/A',
            'price':          str(ride.get('price', '')) if ride else ''
        })
    return jsonify(result)


# ═════════════════════════════════════════════════════════════════
#  API: Pending requests count for driver badge
# ═════════════════════════════════════════════════════════════════

@rides_bp.route('/api/pending-requests-count')
@login_required
def pending_requests_count():
    my_rides   = list(rides_collection.find({'driver_id': session['user_id'], 'status': 'active'}))
    ride_ids   = [str(r['_id']) for r in my_rides]
    count      = ride_requests_collection.count_documents({'ride_id': {'$in': ride_ids}, 'status': 'pending'})
    return jsonify({'count': count})
