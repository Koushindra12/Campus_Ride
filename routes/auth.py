import re
from functools import wraps

import bcrypt
from bson import ObjectId
from flask import (Blueprint, flash, redirect, render_template,
                   request, session, url_for)

from database.mongodb_connection import users_collection
from models.models import create_user

auth_bp = Blueprint('auth', __name__)


# ═════════════════════════════════════════════════════════════════
#  DECORATORS
# ═════════════════════════════════════════════════════════════════

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please login to continue.', 'warning')
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated


# ═════════════════════════════════════════════════════════════════
#  EMAIL VALIDATORS
# ═════════════════════════════════════════════════════════════════

def is_university_email(email):
    """Accepts .ac.in / .edu / .edu.in"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(ac\.in|edu|edu\.in)$'
    return re.match(pattern, email, re.IGNORECASE)


def is_personal_email(email):
    """Accepts Gmail, Yahoo, Outlook, Hotmail, Rediffmail, iCloud, ProtonMail"""
    pattern = (
        r'^[a-zA-Z0-9._%+-]+'
        r'@(gmail|yahoo|outlook|hotmail|rediffmail|icloud|protonmail)'
        r'\.(com|co\.in|in)$'
    )
    return re.match(pattern, email, re.IGNORECASE)


def is_valid_email(email):
    return is_university_email(email) or is_personal_email(email)


# ═════════════════════════════════════════════════════════════════
#  ROUTES
# ═════════════════════════════════════════════════════════════════

@auth_bp.route('/')
def splash():
    return render_template('splash.html')


# ── Login ─────────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if 'user_id' in session:
        return redirect(url_for('auth.dashboard'))

    if request.method == 'POST':
        email    = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '').strip()

        if not email or not password:
            flash('Please fill all fields.', 'error')
            return render_template('login.html')

        user = users_collection.find_one({'email': email})
        if not user:
            flash('No account found with this email.', 'error')
            return render_template('login.html')

        if bcrypt.checkpw(password.encode('utf-8'), user['password']):
            session['user_id']      = str(user['_id'])
            session['user_name']    = user['name']
            session['user_email']   = user['email']
            session['user_role']    = user.get('role', 'passenger')
            session['vehicle_type'] = user.get('vehicle_type', 'no_vehicle')

            if not user.get('is_profile_complete', False):
                return redirect(url_for('profile.setup_profile'))
            return redirect(url_for('auth.dashboard'))
        else:
            flash('Incorrect password. Try again.', 'error')

    return render_template('login.html')


# ── Register ──────────────────────────────────────────────────────
@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name             = request.form.get('name', '').strip()
        email            = request.form.get('email', '').strip().lower()
        email_type       = request.form.get('email_type', 'personal').strip()
        password         = request.form.get('password', '').strip()
        confirm_password = request.form.get('confirm_password', '').strip()

        # ── Field checks ─────────────────────────────────────────
        if not all([name, email, password, confirm_password]):
            flash('Please fill all fields.', 'error')
            return render_template('register.html')

        if password != confirm_password:
            flash('Passwords do not match.', 'error')
            return render_template('register.html')

        if len(password) < 6:
            flash('Password must be at least 6 characters.', 'error')
            return render_template('register.html')

        # ── Email validation based on type ───────────────────────
        if email_type == 'university':
            if not is_university_email(email):
                flash(
                    'Invalid university email. '
                    'Use .ac.in / .edu / .edu.in domain.',
                    'error'
                )
                return render_template('register.html')
        else:
            if not is_personal_email(email):
                flash(
                    'Invalid personal email. '
                    'Use Gmail / Yahoo / Outlook / Hotmail etc.',
                    'error'
                )
                return render_template('register.html')

        # ── Duplicate check ──────────────────────────────────────
        if users_collection.find_one({'email': email}):
            flash('An account with this email already exists.', 'error')
            return render_template('register.html')

        # ── Create user ──────────────────────────────────────────
        hashed    = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        user_data = create_user(
            name=name,
            email=email,
            password_hash=hashed,
            email_type=email_type
        )
        result = users_collection.insert_one(user_data)

        session['user_id']      = str(result.inserted_id)
        session['user_name']    = name
        session['user_email']   = email
        session['user_role']    = 'passenger'
        session['vehicle_type'] = 'no_vehicle'

        flash('Account created! Please complete your profile.', 'success')
        return redirect(url_for('profile.setup_profile'))

    return render_template('register.html')


# ── Dashboard ─────────────────────────────────────────────────────
@auth_bp.route('/dashboard')
@login_required
def dashboard():
    from database.mongodb_connection import rides_collection
    from datetime import date
    user         = users_collection.find_one({'_id': ObjectId(session['user_id'])})
    recent_rides = list(
        rides_collection.find({'status': 'active', 'available_seats': {'$gt': 0}})
        .sort('created_at', -1)
        .limit(5)
    )
    for ride in recent_rides:
        ride['_id'] = str(ride['_id'])
        driver = users_collection.find_one({'_id': ObjectId(ride['driver_id'])})
        ride['driver_name'] = driver['name'] if driver else 'Unknown'
    return render_template(
        'dashboard.html',
        user=user,
        recent_rides=recent_rides,
        today=date.today().isoformat()
    )


# ── Logout ────────────────────────────────────────────────────────
@auth_bp.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out successfully.', 'info')
    return redirect(url_for('auth.login'))


# ── Forgot Password ───────────────────────────────────────────────
@auth_bp.route('/forgot-password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        user  = users_collection.find_one({'email': email})
        if user:
            flash('Password reset instructions sent! (Demo mode)', 'success')
            print(f"🔑 Password reset requested for: {email}")
        else:
            flash('No account found with that email.', 'error')
    return render_template('login.html')