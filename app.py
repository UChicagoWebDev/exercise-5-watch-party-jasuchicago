import logging
import string
import traceback
import random
import sqlite3
from datetime import datetime
from flask import * # Flask, g, redirect, render_template, request, url_for
from functools import wraps

app = Flask(__name__)

# These should make it so your Flask app always returns the latest version of
# your HTML, CSS, and JS files. We would remove them from a production deploy,
# but don't change them here.
app.debug = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# Define a decorator function to validate the API key
def require_api_key(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Get the API key from the request header
        api_key = request.headers.get('X-API-Key')

        # Get all user API keys from the database
        user_api_keys = get_all_user_api_keys()

        # Check if the API key is valid by comparing with the user API keys
        if api_key not in user_api_keys:
            return jsonify({'error': 'Invalid API key'}), 403
        print("api_key is valid, call original function.")
        # If the API key is valid, call the original function
        return func(*args, **kwargs)

    return wrapper


def get_all_user_api_keys():
    # Query the database to get all user API keys
    rows = query_db('SELECT api_key FROM users')
    # Extract API keys from the database rows
    api_keys = [row['api_key'] for row in rows]
    return api_keys

@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-cache"
    return response

def get_db():
    db = getattr(g, '_database', None)

    if db is None:
        db = g._database = sqlite3.connect('db/watchparty.sqlite3')
        db.row_factory = sqlite3.Row
        setattr(g, '_database', db)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None:
        db.close()

def query_db(query, args=(), one=False):
    db = get_db()
    cursor = db.execute(query, args)
    print("query_db")
    print(cursor)
    rows = cursor.fetchall()
    print(rows)
    db.commit()
    cursor.close()
    if rows:
        if one: 
            return rows[0]
        return rows
    return None

def new_user():
    name = "Unnamed User #" + ''.join(random.choices(string.digits, k=6))
    password = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    cookie = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
    api_key = ''.join(random.choices(string.ascii_lowercase + string.digits, k=40))
    u = query_db('INSERT INTO users (name, password, cookie, api_key) ' + 
        'values (?, ?, ?, ?) returning id, name, password, cookie, api_key',
        (name, password, cookie, api_key),
        one=True)
    return u

def get_user_from_cookie(request):
    cookie = request.cookies.get('watch_party_cookie')
    if cookie:
        return query_db('SELECT * FROM users where cookie = ?', [cookie], one=True)
    return None

def render_with_error_handling(template, **kwargs):
    try:
        return render_template(template, **kwargs)
    except:
        t = traceback.format_exc()
        return render_template('error.html', args={"trace": t}), 500

# ------------------------------ NORMAL PAGE ROUTES ----------------------------------

@app.route('/')
def index():
    print("index") # For debugging
    user = get_user_from_cookie(request)

    if user:
        rooms = query_db('SELECT * FROM rooms')
        return render_with_error_handling('index.html', user=user, rooms=rooms)
    
    return render_with_error_handling('index.html', user=None, rooms=None)

@app.route('/rooms/new', methods=['GET', 'POST'])
def create_room():
    print("create room") # For debugging
    user = get_user_from_cookie(request)
    if user is None: return {}, 403

    if (request.method == 'POST'):
        name = "Unnamed Room " + ''.join(random.choices(string.digits, k=6))
        room = query_db('INSERT INTO rooms (name) values (?) returning id', [name], one=True)            
        return redirect(f'{room["id"]}')
    else:
        return app.send_static_file('create_room.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    print("signup")
    user = get_user_from_cookie(request)

    if user:
        return redirect('/profile')
        # return render_with_error_handling('profile.html', user=user) # redirect('/')
    
    if request.method == 'POST':
        u = new_user()
        print("u")
        print(u)
        for key in u.keys():
            print(f'{key}: {u[key]}')

        resp = redirect('/profile')
        resp.set_cookie('watch_party_cookie', str(u['cookie']))
        return resp
    
    return redirect('/login')

@app.route('/profile')
def profile():
    print("profile")
    user = get_user_from_cookie(request)
    if user:
        return render_with_error_handling('profile.html', user=user)
    
    redirect('/login')


@app.route('/login', methods=['GET', 'POST'])
def login():
    print("login")
    user = get_user_from_cookie(request)

    if user:
        return redirect('/')
    
    if request.method == 'POST':
        name = request.form['name']
        password = request.form['password']
        u = query_db('SELECT * FROM users WHERE name = ? and password = ?', [name, password], one=True)
        if user:
            resp = make_response(redirect("/"))
            resp.set_cookie('user_id', u.id)
            resp.set_cookie('user_password', u.password)
            return resp

    return render_with_error_handling('login.html', failed=True)   

@app.route('/logout')
def logout():
    resp = make_response(redirect('/'))
    resp.set_cookie('watch_party_cookie', '')
    return resp

@app.route('/rooms/<int:room_id>')
def room(room_id):
    user = get_user_from_cookie(request)
    if user is None: return redirect('/')

    room = query_db('SELECT * FROM rooms WHERE id = ?', [room_id], one=True)
    return render_with_error_handling('room.html',
            room=room, user=user)

# -------------------------------- API ROUTES ----------------------------------


# POST to change the user's name
@app.route('/api/user/name', methods=['POST'])
@require_api_key
def update_username():
    new_username = request.json.get('username')
    if new_username:
        # Get the current user id
        user_id = request.json.get('user_id')
        if not user_id:
            return {'error': 'User ID not provided'}, 400

        try:
            # Update the username in the database
            db = get_db()
            db.execute('UPDATE users SET name = ? WHERE id = ?', (new_username, user_id))
            db.commit()
            return {'message': 'Username updated successfully'}, 200
        except Exception as e:
            return {'error': str(e)}, 500
    else:
        return {'error': 'New username not provided'}, 400

# POST to change the user's password
@app.route('/api/user/password', methods=['POST'])
@require_api_key
def update_password():
    new_password = request.json.get('password')
    if new_password:
        # Get the current user id
        user_id = request.json.get('user_id')
        if not user_id:
            return {'error': 'User ID not provided'}, 400

        try:
            # Update the password in the database
            db = get_db()
            db.execute('UPDATE users SET password = ? WHERE id = ?', (new_password, user_id))
            db.commit()
            return {'message': 'Password updated successfully'}, 200
        except Exception as e:
            return {'error': str(e)}, 500
    else:
        return {'error': 'New password not provided'}, 400

# POST to change the name of a room
@app.route('/api/room/name', methods=['POST'])
@require_api_key
def update_room_name():
    new_room_name = request.json.get('room_name')
    if new_room_name:
        # Get the current room ID
        room_id = request.json.get('room_id')
        if not room_id:
            return {'error': 'Room ID not provided'}, 400

        try:
            # Update the room name in the database
            db = get_db()
            db.execute('UPDATE rooms SET name = ? WHERE id = ?', (new_room_name, room_id))
            db.commit()
            return {'message': 'Room name updated successfully'}, 200
        except Exception as e:
            return {'error': str(e)}, 500
    else:
        return {'error': 'New room name not provided'}, 400


# GET to get all the messages in a room
@app.route('/api/room/<int:room_id>/messages', methods=['GET'])
@require_api_key
def get_room_messages(room_id):
    try:
        # Get all messages from database
        messages = query_db('SELECT * FROM messages WHERE room_id = ?', [room_id])

        # Convert db rows to dictionaries
        messages_dict = [dict(row) for row in messages]

        # Return result as JSON
        return jsonify(messages_dict), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# POST to post a new message to a room
@app.route('/api/room/<int:room_id>/messages', methods=['POST'])
@require_api_key
def post_message(room_id):
    # Get the message content and user ID from the request
    content = request.json.get('message')
    print("content: " + content)
    user_id = request.json.get('user_id')
    # Check if content and user ID are provided
    if not content or not user_id:
        return jsonify({'error': 'Content and user_id are required'}), 400

    try:
        # INSERT the message into the database
        db = get_db()
        db.execute('INSERT INTO messages (user_id, room_id, body) VALUES (?, ?, ?)',
                   [user_id, room_id, content])
        db.commit()

        # Return success response
        return jsonify({'success': True}), 201
    except Exception as e:
        # Return error response
        return jsonify({'error': str(e)}), 500