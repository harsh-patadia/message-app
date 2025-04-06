import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';

export default function ChatScreen({ route }) {
  const { friend, user } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');

  const fetchMessages = async () => {
    try {
      let response = await fetch(`http://127.0.0.1:5000/messages/${friend._id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user.user_id,
        },
      });
      let json = await response.json();
      if (response.ok) {
        setMessages(json.messages);
      } else {
        alert(json.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error fetching messages");
    }
  };

  const handleSend = async () => {
    if (!newMsg.trim()) return;
    try {
      let response = await fetch('http://127.0.0.1:5000/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': user.user_id },
        body: JSON.stringify({ recipient_id: friend._id, content: newMsg })
      });
      let json = await response.json();
      if (response.ok) {
        setNewMsg('');
        fetchMessages();
      } else {
        alert(json.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error sending message");
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.sender_id === user.user_id;
    return (
      <View style={[styles.messageContainer, isMe ? styles.outgoing : styles.incoming]}>
        <View style={styles.bubble}>
          <Text style={styles.messageText}>{item.content}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList 
        data={messages}
        keyExtractor={(item) => item._id}
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
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  messagesList: { flex: 1, padding: 10 },
  messageContainer: { marginVertical: 5, padding: 10, borderRadius: 10, maxWidth: '80%' },
  incoming: { alignSelf: 'flex-start', backgroundColor: '#eee' },
  outgoing: { alignSelf: 'flex-end', backgroundColor: '#0088cc' },
  bubble: {
    borderRadius: 10,
    padding: 8,
  },
  messageText: { color: '#fff', fontSize: 16 },
  timestamp: { fontSize: 10, color: '#fff', alignSelf: 'flex-end', marginTop: 5 },
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
    alignItems: 'center',
  },
  sendText: { color: '#fff', fontSize: 18 },
});
