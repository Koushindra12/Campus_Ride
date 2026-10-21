from bson import ObjectId
from flask import (Blueprint, flash, redirect, render_template,
                   request, session, url_for)

from database.mongodb_connection import (
    ride_history_collection, rides_collection, users_collection
)
from routes.auth import login_required

profile_bp = Blueprint('profile', __name__)


# ═════════════════════════════���═══════════════════════════════════
#  SETUP PROFILE  (first login)
# ═════════════════════════════════════════════════════════════════

@profile_bp.route('/setup-profile', methods=['GET', 'POST'])
@login_required
def setup_profile():
    user = users_collection.find_one({'_id': ObjectId(session['user_id'])})

    if request.method == 'POST':
        phone        = request.form.get('phone', '').strip()
        department   = request.form.get('department', '').strip()
        vehicle_type = request.form.get('vehicle_type', 'no_vehicle').strip()

        # ── Validations ──────────────────────────────────────────
        if not phone or not department:
            flash('Phone number and department are required.', 'error')
            return render_template('setup_profile.html', user=user)

        if len(phone) != 10 or not phone.isdigit():
            flash('Please enter a valid 10-digit phone number.', 'error')
            return render_template('setup_profile.html', user=user)

        role = 'passenger' if vehicle_type == 'no_vehicle' else 'driver'

        users_collection.update_one(
            {'_id': ObjectId(session['user_id'])},
            {'$set': {
                'phone':               phone,
                'department':          department,
                'vehicle_type':        vehicle_type,
                'role':                role,
                'is_profile_complete': True
            }}
        )
        session['user_role']    = role
        session['vehicle_type'] = vehicle_type

        flash('🎉 Profile complete! Welcome to Campus Rides.', 'success')
        return redirect(url_for('auth.dashboard'))

    return render_template('setup_profile.html', user=user)


# ═════════════════════════════════════════════════════════════════
#  VIEW PROFILE
# ═════════════════════════════════════════════════════════════════

@profile_bp.route('/profile')
@login_required
def profile():
    user = users_collection.find_one({'_id': ObjectId(session['user_id'])})

    history = list(
        ride_history_collection.find({
            '$or': [
                {'driver_id':    session['user_id']},
                {'passenger_id': session['user_id']}
            ]
        }).sort('start_time', -1).limit(10)
    )

    for h in history:
        h['_id'] = str(h['_id'])
        ride = rides_collection.find_one({'_id': ObjectId(h['ride_id'])})
        if ride:
            h['start_location'] = ride.get('start_location', 'N/A')
            h['destination']    = ride.get('destination',    'N/A')
        else:
            h['start_location'] = 'N/A'
            h['destination']    = 'N/A'

    return render_template('profile.html', user=user, history=history, current_user_id=session['user_id'])


# ═════════════════════════════════════════════════════════════════
#  UPDATE PROFILE
# ═════════════════════════════════════════════════════════════════

@profile_bp.route('/update-profile', methods=['POST'])
@login_required
def update_profile():
    name         = request.form.get('name',         '').strip()
    phone        = request.form.get('phone',        '').strip()
    department   = request.form.get('department',   '').strip()
    vehicle_type = request.form.get('vehicle_type', 'no_vehicle').strip()

    if not name or not phone or not department:
        flash('All fields are required.', 'error')
        return redirect(url_for('profile.profile'))

    if len(phone) != 10 or not phone.isdigit():
        flash('Please enter a valid 10-digit phone number.', 'error')
        return redirect(url_for('profile.profile'))

    role = 'passenger' if vehicle_type == 'no_vehicle' else 'driver'

    users_collection.update_one(
        {'_id': ObjectId(session['user_id'])},
        {'$set': {
            'name':         name,
            'phone':        phone,
            'department':   department,
            'vehicle_type': vehicle_type,
            'role':         role
        }}
    )
    session['user_name']    = name
    session['user_role']    = role
    session['vehicle_type'] = vehicle_type

    flash('✅ Profile updated successfully!', 'success')
    return redirect(url_for('profile.profile'))