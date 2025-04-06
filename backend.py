from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
from bson.objectid import ObjectId
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

app.config["MONGO_URI"] = os.environ.get("MONGO_URI",
    "mongodb+srv://harshsoni1029:harshsoni@pigeondb.uropo.mongodb.net/pigeon_db?retryWrites=true&w=majority&appName=pigeondb"
)
mongo = PyMongo(app)

users_col = mongo.db.users
messages_col = mongo.db.messages
groups_col = mongo.db.groups

def create_token(user_id):
    return str(user_id)

def get_user_from_token(token):
    try:
        return users_col.find_one({"_id": ObjectId(token)})
    except Exception:
        return None

@app.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()
        username = data.get("username")
        email = data.get("email")
        if not username or not email or not data.get("password"):
            return jsonify({"error": "Missing fields"}), 400

        if users_col.find_one({"$or": [{"username": username}, {"email": email}]}):
            return jsonify({"error": "Username or Email already exists"}), 400

        user = {
            "user_first_name": data.get("firstName"),
            "user_last_name": data.get("lastName"),
            "profile_photo": None,
            "username": username,
            "email": email,
            "password": data.get("password"),
            "friends": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = users_col.insert_one(user)
        return jsonify({"message": "User registered", "user_id": str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({"error": "Registration failed", "details": str(e)}), 500

@app.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        identifier = data.get("identifier")
        password = data.get("password")

        user = users_col.find_one({"$or": [{"email": identifier}, {"username": identifier}]})
        if not user or user["password"] != password:
            return jsonify({"error": "Invalid credentials"}), 401

        return jsonify({
            "message": "Login successful",
            "user_id": str(user["_id"]),
            "token": create_token(user["_id"])
        }), 200
    except Exception as e:
        return jsonify({"error": "Login failed", "details": str(e)}), 500

@app.route("/friends", methods=["GET"])
def get_friends():
    token = request.headers.get("Authorization")
    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    friends = []
    for friend in user.get("friends", []):
        friend_id = friend.get("friend_id")
        try:
            friend_obj = users_col.find_one({"_id": ObjectId(friend_id)}, {"password": 0})
            if friend_obj:
                friend_obj["_id"] = str(friend_obj["_id"])
                friends.append(friend_obj)
        except:
            continue

    return jsonify({"friends": friends}), 200

@app.route("/messages/<receiver_id>", methods=["GET"])
def get_messages(receiver_id):
    token = request.headers.get("Authorization")
    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        user_id = ObjectId(user["_id"])
        receiver_obj_id = ObjectId(receiver_id)

        # Determine if it's a group or private chat
        group = groups_col.find_one({"_id": receiver_obj_id})
        if group:
            # Group chat
            messages = list(messages_col.find({
                "type": "group",
                "group_id": receiver_obj_id
            }).sort("timestamp", 1))
        else:
            # Private chat
            messages = list(messages_col.find({
                "type": "private",
                "$or": [
                    {"sender_id": user_id, "recipient_id": receiver_obj_id},
                    {"sender_id": receiver_obj_id, "recipient_id": user_id}
                ]
            }).sort("timestamp", 1))

        for msg in messages:
            msg["_id"] = str(msg["_id"])
            msg["sender_id"] = str(msg["sender_id"])
            msg["recipient_id"] = str(msg.get("recipient_id", ""))
            msg["group_id"] = str(msg.get("group_id", ""))
            msg["timestamp"] = msg["timestamp"].isoformat()
            sender = users_col.find_one({"_id": ObjectId(msg["sender_id"])})
            msg["sender_name"] = sender["username"] if sender else "Unknown"

        return jsonify({"messages": messages}), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch messages", "details": str(e)}), 500

@app.route("/messages", methods=["POST"])
def send_message():
    token = request.headers.get("Authorization")
    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        data = request.get_json()
        content = data.get("content")

        message = {
            "sender_id": ObjectId(user["_id"]),
            "content": content,
            "media_url": data.get("media_url"),
            "caption": data.get("caption"),
            "timestamp": datetime.utcnow()
        }

        if data.get("group_id"):
            message["group_id"] = ObjectId(data["group_id"])
            message["type"] = "group"
        elif data.get("recipient_id"):
            message["recipient_id"] = ObjectId(data["recipient_id"])
            message["type"] = "private"
        else:
            return jsonify({"error": "Recipient or group ID required"}), 400

        result = messages_col.insert_one(message)
        message["_id"] = str(result.inserted_id)
        message["sender_id"] = str(message["sender_id"])
        message["timestamp"] = message["timestamp"].isoformat()
        if "group_id" in message:
            message["group_id"] = str(message["group_id"])
        if "recipient_id" in message:
            message["recipient_id"] = str(message["recipient_id"])

        return jsonify({"message": "Message sent", "data": message}), 201
    except Exception as e:
        return jsonify({"error": "Failed to send message", "details": str(e)}), 500

@app.route("/add_friend", methods=["POST"])
def add_friend():
    token = request.headers.get("Authorization")
    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        data = request.get_json()
        friend_id = data.get("friend_id")

        if not friend_id or str(user["_id"]) == friend_id:
            return jsonify({"error": "Invalid friend ID"}), 400

        existing = any(f["friend_id"] == friend_id for f in user.get("friends", []))
        if existing:
            return jsonify({"message": "Already friends"}), 200

        users_col.update_one(
            {"_id": user["_id"]},
            {"$push": {"friends": {"friend_id": friend_id}}}
        )
        users_col.update_one(
            {"_id": ObjectId(friend_id)},
            {"$push": {"friends": {"friend_id": str(user["_id"])}}}
        )

        return jsonify({"message": "Friend added"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to add friend", "details": str(e)}), 500

@app.route("/groups", methods=["GET"])
def get_groups():
    token = request.headers.get("Authorization")
    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        groups = list(groups_col.find({"members": ObjectId(user["_id"])}))
        for group in groups:
            group["_id"] = str(group["_id"])
            group["members"] = [str(mid) for mid in group["members"]]
            group["created_at"] = group["created_at"].isoformat()
            group["updated_at"] = group["updated_at"].isoformat()
        return jsonify({"groups": groups}), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch groups", "details": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)