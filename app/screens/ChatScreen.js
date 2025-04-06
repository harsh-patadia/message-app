import React, { useEffect, useState } from 'react';
import { 
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';

export default function ChatScreen({ route }) {
  const { friend, user } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');

  console.log("friend", friend);
  console.log("user", user);
  

  // Fetch messages from backend
  const fetchMessages = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/messages/${friend.id ? friend.id : friend._id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user.user_id,
        },
      });
      const json = await response.json();
      if (response.ok) {
        setMessages(json.messages);
      } else {
        alert(json.error || "Error fetching messages");
      }
    } catch (error) {
      console.error(error);
      alert("Error fetching messages");
    }
  };

  // Send a new message
  const handleSend = async () => {
    if (!newMsg.trim()) return;
    try {
      const response = await fetch('http://127.0.0.1:5000/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': user.user_id 
        },
        body: JSON.stringify({ recipient_id: friend._id? friend._id : friend.id , content: newMsg })
      });
      const json = await response.json();
      if (response.ok) {
        setNewMsg('');
        fetchMessages();
      } else {
        alert(json.error || "Error sending message");
      }
    } catch (error) {
      console.error(error);
      alert("Error sending message");
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);
  
  // Render each message
  const renderItem = ({ item }) => {
    const isMe = item.sender_id === user.user_id;
    return (
      <View style={[styles.messageContainer, isMe ? styles.outgoing : styles.incoming]}>
        <View style={[styles.bubble, isMe ? styles.outgoingBubble : styles.incomingBubble]}>
          <Text style={[styles.messageText, isMe ? styles.outgoingText : styles.incomingText]}>
            {item.content}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FlatList 
        data={messages}
        keyExtractor={(item) => item._id.toString()}
        renderItem={renderItem}
        style={styles.messagesList}
        contentContainerStyle={{ paddingBottom: 10 }}
      />
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input}
          value={newMsg}
          onChangeText={setNewMsg}
          placeholder="Type a message..."
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f7fa' 
  },
  messagesList: { 
    flex: 1, 
    padding: 10 
  },
  messageContainer: { 
    marginVertical: 5, 
    padding: 5, 
    maxWidth: '80%' 
  },
  incoming: { 
    alignSelf: 'flex-start' 
  },
  outgoing: { 
    alignSelf: 'flex-end' 
  },
  bubble: { 
    borderRadius: 10, 
    padding: 8 
  },
  incomingBubble: { 
    backgroundColor: '#eee' 
  },
  outgoingBubble: { 
    backgroundColor: '#0088cc' 
  },
  messageText: { 
    fontSize: 16 
  },
  incomingText: { 
    color: '#333' 
  },
  outgoingText: { 
    color: '#fff' 
  },
  timestamp: { 
    fontSize: 10, 
    color: '#666', 
    alignSelf: 'flex-end', 
    marginTop: 5 
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff'
  },
  input: { 
    flex: 1,
    backgroundColor: '#f1f3f6',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    fontSize: 16,
    color: '#333'
  },
  sendButton: { 
    backgroundColor: '#0088cc',
    padding: 12,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendText: { 
    color: '#fff',
    fontSize: 18
  }
});
