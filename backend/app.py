from flask import Flask, request, jsonify
from flask_socketio import SocketIO, join_room
from flask_cors import CORS
from flask_mail import Mail, Message
from models import users, items
from utils import generate_otp
from dotenv import load_dotenv
import os
import time
import difflib

load_dotenv()

# create Flask app early
app = Flask(__name__)

# allow all origins for API; simple development CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# initialize Socket.IO
socketio = SocketIO(app, cors_allowed_origins="*")

# Email setup - read configuration from environment variables
app.config['MAIL_SERVER'] = os.getenv("MAIL_SERVER", "smtp.gmail.com")
app.config['MAIL_PORT'] = int(os.getenv("MAIL_PORT", 587))
app.config['MAIL_USERNAME'] = os.getenv("EMAIL_USER")
app.config['MAIL_PASSWORD'] = os.getenv("EMAIL_PASS")
app.config['MAIL_USE_TLS'] = os.getenv("MAIL_USE_TLS", "true").lower() == "true"
app.config['MAIL_USE_SSL'] = os.getenv("MAIL_USE_SSL", "false").lower() == "true"
mail = Mail(app)

# Debug: Log SMTP configuration on startup
print(f"[App Setup] MAIL_SERVER: {app.config['MAIL_SERVER']}")
print(f"[App Setup] MAIL_PORT: {app.config['MAIL_PORT']}")
print(f"[App Setup] MAIL_USERNAME: {app.config['MAIL_USERNAME']}")
print(f"[App Setup] MAIL_PASSWORD: {'***' if app.config['MAIL_PASSWORD'] else 'NOT SET'}")
print(f"[App Setup] MAIL_USE_TLS: {app.config['MAIL_USE_TLS']}")
print(f"[App Setup] MAIL_USE_SSL: {app.config['MAIL_USE_SSL']}")

# In-memory rate limiting / request tracking (simple, non-persistent)
otp_send_log = {}       # key: item name -> list of send timestamps
user_verify_log = {}    # key: user email -> (otp, timestamp)

# Configuration
OTP_SEND_LIMIT = 3      # max OTP emails per item per hour
OTP_SEND_WINDOW = 60*60
OTP_EXPIRY = 10*60      # seconds
SUBMISSION_LIMIT = 20   # max items per user per 24h
SUBMISSION_WINDOW = 24*60*60


@app.route("/api/register", methods=["POST"])
def register_user():
    data = request.json or {}
    print(f"[Register] Received request: {data}")
    email = data.get("email") or data.get("ownerEmail")
    if not email:
        print(f"[Register] Error: No email provided")
        return jsonify({"message": "Email required"}), 400
    user = users.find_one({"email": email})
    if user:
        print(f"[Register] Error: User {email} already exists")
        return jsonify({"message": "User already exists"}), 400
    doc = {"email": email, "name": data.get("name"), "verified": False}
    users.insert_one(doc)
    print(f"[Register] User {email} created successfully")
    # send verification otp
    otp = generate_otp()
    user_verify_log[email] = (otp, time.time())
    print(f"[Register] Generated OTP {otp} for {email}")
    otp_response = {"message": "User created; verification OTP sent"}
    try:
        msg = Message(subject="Verify your account",
                      sender=os.getenv("EMAIL_USER"),
                      recipients=[email],
                      body=f"Your verification OTP is {otp}")
        print(f"[Email] Sending OTP to {email}...")
        mail.send(msg)
        print(f"[Email] OTP sent successfully to {email}")
    except Exception as e:
        print(f"[Email Error] failed to send verification OTP to {email}: {e}")
        print(f"[Email Error] Details: {type(e).__name__}")
    # always include OTP in response when running in debug mode or env flag
    if os.getenv("SHOW_OTP", "false").lower() == "true":
        otp_response["otp"] = otp
    return jsonify(otp_response), 200


@app.route("/api/user/exists", methods=["GET"])
def user_exists():
    email = request.args.get("email")
    if not email:
        return jsonify({"exists": False}), 200
    user = users.find_one({"email": email})
    return jsonify({"exists": bool(user)}), 200


@app.route("/api/user/login", methods=["POST"])
def user_login():
    data = request.json or {}
    email = data.get("email")
    if not email:
        return jsonify({"message": "email required"}), 400
    user = users.find_one({"email": email})
    if not user:
        return jsonify({"message": "User not found"}), 404
    # generate OTP and send for login
    otp = generate_otp()
    user_verify_log[email] = (otp, time.time())
    response = {"message": "Login OTP sent"}
    try:
        msg = Message(subject="Your login OTP",
                      sender=os.getenv("EMAIL_USER"),
                      recipients=[email],
                      body=f"Your login OTP is {otp}")
        mail.send(msg)
    except Exception as e:
        print(f"[Email Error] failed to send login OTP to {email}: {e}")
    if os.getenv("SHOW_OTP", "false").lower() == "true":
        response["otp"] = otp
    return jsonify(response), 200


def find_matching_items(email):
    """Find items that match the user's reported items (lost matches with found, and vice versa)"""
    user_items_list = list(items.find({"ownerEmail": email}, {"_id": 0}))
    matches = []
    
    for user_item in user_items_list:
        user_item_type = user_item.get("type")  # 'lost' or 'found'
        user_item_desc = (user_item.get("description") or "").lower()
        user_item_name = (user_item.get("name") or "").lower()
        
        # Look for opposite type items with similar description
        opposite_type = "found" if user_item_type == "lost" else "lost"
        candidates = list(items.find({"type": opposite_type}, {"_id": 0}))
        
        for candidate in candidates:
            cand_desc = (candidate.get("description") or "").lower()
            cand_name = (candidate.get("name") or "").lower()
            
            # Calculate match scores
            score_name = difflib.SequenceMatcher(None, user_item_name, cand_name).ratio()
            score_desc = difflib.SequenceMatcher(None, user_item_desc, cand_desc).ratio()
            score = max(score_name, score_desc)
            
            # If match score is high enough (> 0.5) and not already claimed
            if score > 0.5 and not candidate.get("claimed"):
                matches.append({
                    "id": candidate.get("name"),
                    "type": candidate.get("type"),
                    "name": candidate.get("name"),
                    "description": candidate.get("description"),
                    "ownerEmail": candidate.get("ownerEmail"),
                    "matchScore": round(score * 100, 1),
                    "message": f"Found match for your {user_item_type} item '{user_item.get('name')}': A {opposite_type} item '{candidate.get('name')}' was reported!"
                })
    
    return matches


def save_notification(to_email, notification):
    """Persist notification to user's record (prepend to list)."""
    try:
        user = users.find_one({"email": to_email})
        if not user:
            return
        existing = user.get("notifications") or []
        # keep newest first
        new_list = [notification] + existing
        users.update_one({"email": to_email}, {"$set": {"notifications": new_list}})
    except Exception as e:
        print(f"[Notification Error] failed to persist notification for {to_email}: {e}")


@app.route("/api/user/verify", methods=["POST"])
def user_verify():
    data = request.json or {}
    email = data.get("email")
    otp = data.get("otp")
    if not email or not otp:
        return jsonify({"message": "email and otp required"}), 400
    print(f"[Verify] Checking OTP for {email}: log has {list(user_verify_log.keys())}")
    record = user_verify_log.get(email)
    if not record:
        return jsonify({"message": "No OTP requested"}), 400
    expected, ts = record
    if time.time() - ts > OTP_EXPIRY:
        return jsonify({"message": "OTP expired"}), 400
    if otp != expected:
        return jsonify({"message": "Invalid OTP"}), 400
    users.update_one({"email": email}, {"$set": {"verified": True}})
    user_verify_log.pop(email, None)
    # return user info after successful verification
    user_obj = users.find_one({"email": email}, {"_id": 0})
    
    # Find matching items and send notifications
    matching_items = find_matching_items(email)
    if matching_items:
        print(f"[Verify] Found {len(matching_items)} matches for {email}")
        for match in matching_items:
            print(f"[Notification] {match['message']}")
            # emit via socket to user's room (if connected)
            try:
                socketio.emit('notification', {'notifications': [match]}, room=email)
                # persist notification and also emit to recipient (owner of matched item)
                owner = match.get('ownerEmail')
                if owner:
                    save_notification(owner, match)
                    try:
                        socketio.emit('notification', {'notifications': [match]}, room=owner)
                    except Exception as e:
                        print(f"[Socket Error] emit to owner failed: {e}")
            except Exception as e:
                print(f"[Socket Error] emit failed: {e}")
    
    response = {"message": "User verified", "user": user_obj}
    if matching_items:
        response["notifications"] = matching_items
    
    return jsonify(response), 200


@app.route("/api/item/add", methods=["POST"])
def add_item():
    data = request.json or {}
    owner = data.get("ownerEmail") or data.get("email")
    if not owner:
        return jsonify({"message": "ownerEmail required"}), 400
    # basic validation
    if not data.get("name") or not data.get("name").strip():
        return jsonify({"message": "Item name required"}), 400
    if not data.get("description") or not data.get("description").strip():
        return jsonify({"message": "Description required"}), 400
    for mfield in ("mobile", "altMobile"):
        if mfield in data and data[mfield]:
            if not isinstance(data[mfield], str) or not data[mfield].isdigit() or len(data[mfield]) != 10:
                return jsonify({"message": f"{mfield} must be exactly 10 digits"}), 400
    # rate limit submissions per user
    cutoff = time.time() - SUBMISSION_WINDOW
    recent_count = items.count_documents({"ownerEmail": owner, "created_at": {"$gte": cutoff}})
    if recent_count >= SUBMISSION_LIMIT:
        return jsonify({"message": "Submission limit exceeded"}), 429
    data["claimed"] = False
    data["created_at"] = time.time()
    # accept mobile numbers if provided
    if "mobile" in data:
        data["mobile"] = data.get("mobile")
    if "altMobile" in data:
        data["altMobile"] = data.get("altMobile")
    # store image if provided (base64 string)
    if data.get("image"):
        data["image"] = data.get("image")
    items.insert_one(data)
    return jsonify({"message": "Item added successfully"}), 200


@app.route("/api/items", methods=["GET"])
def get_items():
    all_items = list(items.find({}, {"_id": 0}))
    return jsonify(all_items)


@app.route("/api/user/items", methods=["GET"])
def user_items():
    email = request.args.get("email")
    if not email:
        return jsonify({"message": "email query parameter required"}), 400
    user_items = list(items.find({"ownerEmail": email}, {"_id": 0}))
    return jsonify(user_items)


@app.route("/api/match", methods=["GET"])
def match_items():
    # match by name or description query param
    q = request.args.get("q")
    if not q:
        return jsonify([])
    candidates = list(items.find({}, {"_id": 0}))
    results = []
    for c in candidates:
        score_name = difflib.SequenceMatcher(None, q.lower(), (c.get("name") or "").lower()).ratio()
        score_desc = difflib.SequenceMatcher(None, q.lower(), (c.get("description") or "").lower()).ratio()
        score = max(score_name, score_desc)
        if score > 0.3:
            results.append({"item": c, "score": score})
    results.sort(key=lambda x: x["score"], reverse=True)
    return jsonify(results[:10])


@app.route("/api/item/claim/<name>", methods=["POST"])
def claim_item(name):
    item = items.find_one({"name": name})
    if not item:
        return jsonify({"message": "Item not found"}), 404
    now = time.time()
    # enforce per-item OTP send limit
    sends = [t for t in otp_send_log.get(name, []) if now - t < OTP_SEND_WINDOW]
    if len(sends) >= OTP_SEND_LIMIT:
        return jsonify({"message": "OTP send limit reached for this item"}), 429
    otp = generate_otp()
    items.update_one({"name": name}, {"$set": {"otp": otp, "otp_ts": now}})
    owner_email = item.get("ownerEmail") or item.get("owner_email")
    if not owner_email:
        return jsonify({"message": "Owner email not found on item"}), 400
    try:
        msg = Message(subject="OTP for claiming your item",
                      sender=os.getenv("EMAIL_USER"),
                      recipients=[owner_email],
                      body=f"Your OTP is {otp}")
        mail.send(msg)
    except Exception as e:
        print(f"[Email Error] failed to send claim OTP for {name} to {owner_email}: {e}")
        pass
    sends.append(now)
    otp_send_log[name] = sends
    response = {"message": "OTP sent to email"}
    if os.getenv("SHOW_OTP", "false").lower() == "true":
        response["otp"] = otp
    return jsonify(response), 200


@socketio.on('join')
def handle_join(data):
    email = data.get('email') if isinstance(data, dict) else None
    if email:
        try:
            join_room(email)
            print(f"[Socket] {email} joined room")
        except Exception as e:
            print(f"[Socket] join failed: {e}")


@app.route("/api/item/verify/<name>", methods=["POST"])
def verify_otp(name):
    data = request.json or {}
    otp = data.get("otp")
    if not otp:
        return jsonify({"message": "otp required"}), 400
    item = items.find_one({"name": name})
    if not item:
        return jsonify({"message": "Item not found"}), 404
    stored = item.get("otp")
    ts = item.get("otp_ts")
    if not stored or not ts or time.time() - ts > OTP_EXPIRY:
        return jsonify({"message": "OTP expired or not set"}), 400
    if stored == otp:
        items.update_one({"name": name}, {"$set": {"claimed": True, "otp": None, "otp_ts": None}})
        # notify owner via socket and persist notification
        try:
            item_owner = item.get('ownerEmail') or item.get('owner_email')
            note = {
                'type': item.get('type'),
                'name': item.get('name'),
                'message': f"Your item '{item.get('name')}' was claimed.",
                'matchScore': 100
            }
            if item_owner:
                # increment claimedCount on owner record
                try:
                    users.update_one({"email": item_owner}, {"$inc": {"claimedCount": 1}})
                except Exception as e:
                    print(f"[Notify Error] failed to increment claimedCount for {item_owner}: {e}")
                save_notification(item_owner, note)
                try:
                    socketio.emit('notification', {'notifications': [note]}, room=item_owner)
                except Exception as e:
                    print(f"[Socket Error] emit claimed notification failed: {e}")
                try:
                    socketio.emit('item_claimed', {'name': name}, room=item_owner)
                except Exception as e:
                    print(f"[Socket Error] emit item_claimed failed: {e}")
        except Exception as e:
            print(f"[Notify Error] failed to notify owner on claim: {e}")
        return jsonify({"message": "OTP verified. Item claimed!"}), 200
    return jsonify({"message": "Invalid OTP"}), 400


@app.route("/api/item/edit/<name>", methods=["PUT"])
def edit_item(name):
    data = request.json or {}
    owner = data.get("ownerEmail")
    if not owner:
        return jsonify({"message": "ownerEmail required"}), 400
    item = items.find_one({"name": name})
    if not item:
        return jsonify({"message": "Item not found"}), 404
    if item.get("ownerEmail") != owner and item.get("owner_email") != owner:
        return jsonify({"message": "Not authorized"}), 403
    # update allowed fields
    update = {}
    for field in ["name", "description", "location", "date", "category", "image", "mobile", "altMobile"]:
        if field in data:
            update[field] = data[field]
    if update:
        items.update_one({"name": name}, {"$set": update})
    return jsonify({"message": "Item updated"}), 200

@app.route("/api/item/delete/<name>", methods=["DELETE"])
def delete_item(name):
    data = request.json or {}
    owner = data.get("ownerEmail")
    if not owner:
        return jsonify({"message": "ownerEmail required"}), 400
    item = items.find_one({"name": name})
    if not item:
        return jsonify({"message": "Item not found"}), 404
    if item.get("ownerEmail") != owner and item.get("owner_email") != owner:
        return jsonify({"message": "Not authorized"}), 403
    items.delete_one({"name": name})
    return jsonify({"message": "Item deleted"}), 200


@app.route("/api/notify/match", methods=["POST"])
def notify_match():
    """Notify the other user about a potential match"""
    data = request.json or {}
    from_email = data.get("fromEmail")
    to_email = data.get("toEmail")
    item_name = data.get("itemName")
    message = data.get("message", "I found a match for your lost item!")
    
    if not from_email or not to_email or not item_name:
        return jsonify({"message": "fromEmail, toEmail, and itemName required"}), 400
    
    # Find the item
    item = items.find_one({"name": item_name})
    if not item:
        return jsonify({"message": "Item not found"}), 404
    
    # Get recipient user
    recipient = users.find_one({"email": to_email})
    if not recipient:
        return jsonify({"message": "Recipient not found"}), 404
    
    # Send email notification
    try:
        sender_user = users.find_one({"email": from_email})
        sender_name = sender_user.get("name") if sender_user else from_email
        
        email_body = f"""
Hello {recipient.get('name', 'User')},

{sender_name} ({from_email}) found a match for your item "{item_name}".

Message: {message}

Item Details:
- Name: {item.get('name')}
- Type: {item.get('type')}
- Description: {item.get('description', 'No description')}

Please log in to UnLost to view more details and connect with them.

Best regards,
UnLost Team
"""
        
        msg = Message(
            subject=f"Potential Match Found for Your Item: {item_name}",
            sender=os.getenv("EMAIL_USER"),
            recipients=[to_email],
            body=email_body
        )
        mail.send(msg)
        print(f"[Notification] Email sent to {to_email} about match for {item_name}")
        # persist and emit notification
        note = {"type": item.get('type'), "name": item.get('name'), "message": message, "matchScore": 100}
        save_notification(to_email, note)
        try:
            socketio.emit('notification', {'notifications': [note]}, room=to_email)
        except Exception as e:
            print(f"[Socket Error] emit notify_match failed: {e}")
        return jsonify({"message": "Notification sent successfully"}), 200
    except Exception as e:
        print(f"[Email Error] Failed to send notification email to {to_email}: {e}")
        # Still return success even if email fails, since notification was recorded
        note = {"type": item.get('type'), "name": item.get('name'), "message": message, "matchScore": 100}
        save_notification(to_email, note)
        try:
            socketio.emit('notification', {'notifications': [note]}, room=to_email)
        except Exception as e2:
            print(f"[Socket Error] emit notify_match failed after email error: {e2}")
        return jsonify({"message": "Notification recorded (email delivery may have failed)"}), 200


@app.route("/api/user/notifications", methods=["GET"])
def get_notifications():
    email = request.args.get("email")
    if not email:
        return jsonify({"message":"email required"}), 400
    user = users.find_one({"email": email})
    notes = user.get("notifications", []) if user else []
    return jsonify(notes), 200


@app.route("/api/user/notifications/clear", methods=["POST"])
def clear_notifications():
    data = request.json or {}
    email = data.get("email")
    if not email:
        return jsonify({"message":"email required"}), 400
    users.update_one({"email": email}, {"$set": {"notifications": []}})
    return jsonify({"message":"notifications cleared"}), 200


@app.route("/api/geocode/reverse", methods=["GET"])
def reverse_geocode():
    """Reverse geocoding: coordinates -> address"""
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    
    if not lat or not lon:
        return jsonify({"message": "lat and lon required"}), 400
    
    try:
        import requests
        response = requests.get(
            f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}",
            timeout=5
        )
        if response.status_code != 200:
            return jsonify({"message": "Geocoding service error"}), response.status_code
        data = response.json()
        address = data.get("display_name", f"{lat}, {lon}")
        return jsonify({"address": address}), 200
    except Exception as err:
        print(f"Reverse geocoding error: {err}")
        return jsonify({"message": str(err)}), 500


@app.route("/api/geocode/search", methods=["GET"])
def search_geocode():
    """Forward geocoding: location name -> address"""
    query = request.args.get("q")
    
    if not query or len(query.strip()) == 0:
        return jsonify({"message": "search query required"}), 400
    
    try:
        import requests
        response = requests.get(
            f"https://nominatim.openstreetmap.org/search?format=json&q={query}&limit=1",
            timeout=5
        )
        if response.status_code != 200:
            return jsonify({"message": "Search service error"}), response.status_code
        results = response.json()
        
        if not results:
            return jsonify({"message": "Location not found"}), 404
        
        result = results[0]
        address = result.get("display_name", query)
        return jsonify({"address": address}), 200
    except Exception as err:
        print(f"Forward geocoding error: {err}")
        return jsonify({"message": str(err)}), 500


if __name__ == "__main__":
    socketio.run(app, port=int(os.getenv("PORT", 5000)), debug=True)
