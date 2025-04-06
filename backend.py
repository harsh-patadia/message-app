from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS
from bson.objectid import ObjectId
from datetime import datetime
import os

app = Flask(__name__)
CORS(app, supports_credentials=True)

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
@app.before_request
def log_request_info():
    print(request.method, request.url)

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
            "password": data.get("password"),  # Plain text for demo purposes
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

@app.route('/friends', methods=['GET'])
def get_friends():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Missing Authorization token'}), 401

    try:
        user_id = ObjectId(token)
    except Exception:
        return jsonify({'error': 'Invalid user ID'}), 400

    user = users_col.find_one({'_id': user_id})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    friend_ids = []

    for entry in user.get('friends', []):
        friend_id = entry.get('friend_id') if isinstance(entry, dict) else entry

        if isinstance(friend_id, dict) and '$oid' in friend_id:
            try:
                friend_ids.append(ObjectId(friend_id['$oid']))
            except:
                continue
        elif isinstance(friend_id, str):
            try:
                friend_ids.append(ObjectId(friend_id))
            except:
                continue
        elif isinstance(friend_id, ObjectId):
            friend_ids.append(friend_id)

    friends = []
    if friend_ids:
        friend_docs = users_col.find({'_id': {'$in': friend_ids}})
        for doc in friend_docs:
            friends.append({
                'id': str(doc['_id']),
                'name': doc.get('user_first_name', '') + " " + doc.get('user_last_name', ''),
                'email': doc.get('email'),
                'username': doc.get('username'),
                'profile_photo': doc.get('profile_photo'),
            })

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
        # Check if the receiver_id corresponds to a group
        group = groups_col.find_one({"_id": receiver_obj_id})
        if group:
            messages = list(messages_col.find({
                "type": "group",
                "group_id": receiver_obj_id
            }).sort("timestamp", 1))
        else:
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
        if not content:
            return jsonify({"error": "Content cannot be empty"}), 400

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
def add_group_friend():
    token = request.headers.get("Authorization")
    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    try:
        data = request.get_json()
        friend_id = data.get("friend_id")
        if not friend_id or str(user["_id"]) == friend_id:
            return jsonify({"error": "Invalid friend ID"}), 400
        if any(f["friend_id"] == friend_id for f in user.get("friends", [])):
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
            group["members"] = [str(mid) for mid in group.get("members", [])]
            group["created_by"] = str(group.get("created_by")) if group.get("created_by") else None
            group["created_at"] = group["created_at"].isoformat() if "created_at" in group else ""
            group["updated_at"] = group["updated_at"].isoformat() if "updated_at" in group else ""
        return jsonify({"groups": groups}), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch groups", "details": str(e)}), 500

@app.route("/group/<group_id>", methods=["GET"])
def get_group_details(group_id):
    token = request.headers.get("Authorization")
    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        group = groups_col.find_one({"_id": ObjectId(group_id)})
        if not group:
            return jsonify({"error": "Group not found"}), 404

        # Convert group ID
        group_id_str = str(group["_id"])

        # Normalize and collect member ObjectIds
        member_ids = []
        for m in group.get("members", []):
            if isinstance(m, dict) and "$oid" in m:
                try:
                    member_ids.append(ObjectId(m["$oid"]))
                except:
                    continue
            elif isinstance(m, ObjectId):
                member_ids.append(m)

        # Fetch and format member details
        members_info = []
        if member_ids:
            member_docs = users_col.find({"_id": {"$in": member_ids}}, {"password": 0})
            for member in member_docs:
                members_info.append({
                    "id": str(member["_id"]),
                    "name": f"{member.get('user_first_name', '')} {member.get('user_last_name', '')}".strip(),
                    "username": member.get("username"),
                    "email": member.get("email"),
                    "profile_photo": member.get("profile_photo")
                })

        group_data = {
            "id": group_id_str,
            "name": group.get("name"),
            "members": members_info,
            "created_at": group.get("created_at").isoformat() if "created_at" in group else "",
            "updated_at": group.get("updated_at").isoformat() if "updated_at" in group else ""
        }

        return jsonify({"group": group_data}), 200

    except Exception as e:
        return jsonify({"error": "Failed to fetch group details", "details": str(e)}), 500

@app.route("/search_users", methods=["GET"])
def search_users():
    token = request.headers.get("Authorization")
    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    query = request.args.get("username", "")
    if not query:
        return jsonify({"error": "No search query provided"}), 400

    try:
        users = list(users_col.find(
            {"username": {"$regex": query, "$options": "i"}},
            {"password": 0}
        ))

        results = []
        for u in users:
            if str(u["_id"]) == str(user["_id"]):
                continue

            results.append({
                "id": str(u["_id"]),
                "name": f"{u.get('user_first_name', '')} {u.get('user_last_name', '')}".strip(),
                "username": u.get("username"),
                "email": u.get("email"),
                "profile_photo": u.get("profile_photo"),
            })

        return jsonify({"users": results}), 200

    except Exception as e:
        return jsonify({"error": "Failed to search users", "details": str(e)}), 500

# New API: Add User to Group
@app.route("/groups/<group_id>/add_user", methods=["POST"])
def add_user_to_group(group_id):
    token = request.headers.get("Authorization")
    user = get_user_from_token(token)
    if not user:
        return jsonify({"error": "Unauthorized"}), 401
    try:
        data = request.get_json()
        new_user_id = data.get("user_id")
        if not new_user_id:
            return jsonify({"error": "user_id is required"}), 400
        group = groups_col.find_one({"_id": ObjectId(group_id)})
        if not group:
            return jsonify({"error": "Group not found"}), 404
        if new_user_id in [str(mid) for mid in group.get("members", [])]:
            return jsonify({"message": "User is already a member"}), 200
        groups_col.update_one(
            {"_id": ObjectId(group_id)},
            {"$push": {"members": ObjectId(new_user_id)}}
        )
        return jsonify({"message": "User added to group successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Failed to add user to group", "details": str(e)}), 500

@app.route('/users/add-friend', methods=['POST'])
def add_user_friend():
    data = request.json
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Missing Authorization token'}), 401

    try:
        user_id = ObjectId(token)
    except Exception:
        return jsonify({'error': 'Invalid user ID'}), 400

    user = users_col.find_one({'_id': user_id})
    if not user:
        return jsonify({'error': 'User not found'}), 404

    friend_id_str = data.get('friend_id')
    if not friend_id_str:
        return jsonify({'error': 'Missing friend_id'}), 400

    try:
        friend_id = ObjectId(friend_id_str)
    except Exception:
        return jsonify({'error': 'Invalid friend ID'}), 400

    # Prevent self-friendship
    if friend_id == user_id:
        return jsonify({'error': 'You cannot add yourself as a friend'}), 400

    friend = users_col.find_one({'_id': friend_id})
    if not friend:
        return jsonify({'error': 'Friend not found'}), 404

    # ✅ Convert IDs to string while storing
    friend_id_str = str(friend_id)
    user_id_str = str(user_id)

    # Add to user's friends list
    users_col.update_one(
        {'_id': user_id},
        {'$addToSet': {'friends': {'friend_id': friend_id_str}}}
    )

    # Add to friend's friends list (bi-directional)
    users_col.update_one(
        {'_id': friend_id},
        {'$addToSet': {'friends': {'friend_id': user_id_str}}}
    )
    return jsonify({'message': 'Friend added successfully'}), 200

from flask import request, jsonify
from bson import ObjectId
from datetime import datetime

@app.route('/groups/create', methods=['POST'])
def create_group():
    try:
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Missing Authorization token'}), 401

        try:
            user_id = ObjectId(token)
        except Exception:
            return jsonify({'error': 'Invalid user ID'}), 400

        data = request.json
        group_name = data.get('name')
        member_ids = data.get('members')  # Should be a list of user_id strings

        if not group_name or not isinstance(member_ids, list):
            return jsonify({'error': 'Invalid request body'}), 400

        # Convert all member IDs to ObjectId and validate
        try:
            member_object_ids = [ObjectId(mid) for mid in member_ids]
        except Exception:
            return jsonify({'error': 'One or more invalid member IDs'}), 400

        # Ensure the creator is part of the group
        if user_id not in member_object_ids:
            member_object_ids.append(user_id)

        now = datetime.utcnow()

        group_data = {
            "name": group_name,
            "members": member_object_ids,  # List of ObjectIds
            "created_at": now,
            "updated_at": now
        }

        result = groups_col.insert_one(group_data)

        return jsonify({
            "message": "Group created successfully",
            "group_id": str(result.inserted_id)
        }), 201

    except Exception as e:
        return jsonify({
            "error": "Failed to create group",
            "details": str(e)
        }), 500
    
if __name__ == "__main__":
    app.run(debug=True)
