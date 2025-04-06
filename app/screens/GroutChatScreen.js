import React, { useEffect, useState } from 'react';
import { 
  View, Text, TextInput, FlatList, TouchableOpacity, 
  Button, StyleSheet, KeyboardAvoidingView, Platform 
} from 'react-native';

export default function GroupChatScreen({ route }) {
  const { group, user } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');

  const fetchGroupMessages = async () => {
    try {
      let response = await fetch(`http://127.0.0.1:5000/messages/${group._id}`, {
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
    } catch (err) {
      console.error(err);
      alert('Failed to load messages');
    }
  };

  const sendGroupMessage = async () => {
    if (!newMsg.trim()) return;
    try {
      let res = await fetch(`http://127.0.0.1:5000/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user.user_id,
        },
        body: JSON.stringify({ group_id: group._id, content: newMsg })
      });
      let json = await res.json();
      if (res.ok) {
        setNewMsg('');
        fetchGroupMessages();
      } else {
        alert(json.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to send message');
    }
  };

  useEffect(() => {
    fetchGroupMessages();
  }, []);

  const renderItem = ({ item }) => (
    <View style={[styles.messageContainer, item.sender_id === user.user_id ? styles.outgoing : styles.incoming]}>
      <Text style={styles.senderName}>{item.sender_name}</Text>
      <Text style={styles.messageText}>{item.content}</Text>
      <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        style={styles.messagesList}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMsg}
          onChangeText={setNewMsg}
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendGroupMessage}>
          <Text style={styles.sendText}>Send</Text>
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
  senderName: { fontSize: 12, color: '#444', fontWeight: 'bold' },
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
  sendText: { color: '#fff', fontSize: 16 },
});
