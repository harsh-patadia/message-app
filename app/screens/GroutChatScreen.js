import React, { useEffect, useState } from 'react';
import { 
  View, Text, TextInput, FlatList, TouchableOpacity, 
  Button, StyleSheet, KeyboardAvoidingView, Platform, Modal, ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function GroupChatScreen({ route, navigation }) {
  const { group, user } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]); // Full user objects
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Fetch group messages
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

  // Fetch full group details (with member info) when modal opens
  const fetchGroupDetails = async () => {
    try {
      let response = await fetch(`http://127.0.0.1:5000/group/${group._id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user.user_id,
        },
      });
      let json = await response.json();
      if (response.ok) {
        // Expecting json.group.members to be an array of full user objects
        setGroupMembers(json.group.members);
      } else {
        alert(json.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to fetch group details');
    }
  };

  const openMembersModal = () => {
    fetchGroupDetails(); // Refresh group members list
    setShowMembersModal(true);
  };

  // Search users by username using backend endpoint
  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      let res = await fetch(`http://127.0.0.1:5000/search_users?username=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user.user_id,
        },
      });
      let json = await res.json();
      if (res.ok) {
        setSearchResults(json.users);
      } else {
        alert(json.error);
      }
    } catch (err) {
      console.error(err);
      alert('Search failed');
    }
  };

  // Add user to group using backend endpoint
  const addUserToGroup = async (userIdToAdd) => {
    try {
      let res = await fetch(`http://127.0.0.1:5000/groups/${group._id}/add_user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user.user_id,
        },
        body: JSON.stringify({ user_id: userIdToAdd })
      });
      let json = await res.json();
      if (res.ok) {
        alert("User added successfully.");
        // Re-fetch group details to update members list
        fetchGroupDetails();
        setSearchResults([]);
        setSearchQuery('');
      } else {
        alert(json.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to add user.');
    }
  };

  // Navigate to private chat when a member is clicked
  const handleMemberPress = (member) => {
    // Debug log
    console.log("Member pressed:", member);
    navigation.navigate('Chat', { friend: member, user });
    setShowMembersModal(false);
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === user.user_id;
    return (
      <View style={[styles.messageContainer, isMe ? styles.outgoing : styles.incoming]}>
        <Text style={styles.senderName}>{item.sender_name}</Text>
        <Text style={styles.messageText}>{item.content}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const renderMember = ({ item }) => {
    return (
      <TouchableOpacity style={styles.memberItem} onPress={() => handleMemberPress(item)}>
        <Text style={styles.memberText}>{item.username}</Text>
      </TouchableOpacity>
    );
  };

  const renderSearchResult = ({ item }) => {
    return (
      <View style={styles.searchResultItem}>
        <Text style={styles.searchResultText}>{item.username}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => addUserToGroup(item._id)}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient 
        colors={['#0088cc', '#005fa3']} 
        style={styles.headerContainer}
      >
        <Text style={styles.headerTitle}>{group.name}</Text>
        <TouchableOpacity onPress={openMembersModal} style={styles.membersButton}>
          <Text style={styles.membersButtonText}>Members</Text>
        </TouchableOpacity>
      </LinearGradient>
      <FlatList 
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={{ paddingBottom: 10 }}
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

      {/* Modal for group members and adding new users */}
      <Modal 
        visible={showMembersModal} 
        animationType="slide" 
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Group Members</Text>
          <FlatList 
            data={groupMembers}
            keyExtractor={(item) => item._id}
            renderItem={renderMember}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
          <Text style={styles.modalSubtitle}>Add New Member</Text>
          <View style={styles.searchContainer}>
            <TextInput 
              style={styles.searchInput}
              placeholder="Search by username"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.searchButton} onPress={searchUsers}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
          <FlatList 
            data={searchResults}
            keyExtractor={(item) => item._id}
            renderItem={renderSearchResult}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
          <Button title="Close" onPress={() => setShowMembersModal(false)} />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerTitle: { 
    color: '#fff', 
    fontSize: 22, 
    fontWeight: 'bold' 
  },
  membersButton: {
    backgroundColor: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  membersButtonText: {
    color: '#0088cc',
    fontSize: 14,
    fontWeight: '600',
  },
  messagesList: { flex: 1, paddingHorizontal: 10 },
  messageContainer: { 
    marginVertical: 5, 
    padding: 10, 
    borderRadius: 10, 
    maxWidth: '80%' 
  },
  incoming: { 
    alignSelf: 'flex-start', 
    backgroundColor: '#e9e9eb' 
  },
  outgoing: { 
    alignSelf: 'flex-end', 
    backgroundColor: '#0088cc' 
  },
  bubble: {
    borderRadius: 10,
    padding: 8,
  },
  senderName: { 
    fontSize: 12, 
    color: '#444', 
    fontWeight: 'bold', 
    marginBottom: 2 
  },
  messageText: { 
    color: '#fff', 
    fontSize: 16 
  },
  timestamp: { 
    fontSize: 10, 
    color: '#fff', 
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
  },
  modalContainer: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff' 
  },
  modalTitle: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  modalSubtitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    marginVertical: 10 
  },
  searchContainer: { 
    flexDirection: 'row', 
    marginBottom: 10 
  },
  searchInput: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    fontSize: 16, 
    color: '#333' 
  },
  searchButton: { 
    backgroundColor: '#0088cc', 
    padding: 10, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 10 
  },
  searchButtonText: { 
    color: '#fff', 
    fontSize: 16 
  },
  memberItem: { 
    padding: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#ccc' 
  },
  memberText: { 
    fontSize: 16, 
    color: '#333' 
  },
  searchResultItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#ccc' 
  },
  searchResultText: { 
    flex: 1, 
    fontSize: 16, 
    color: '#333' 
  },
  addButton: { 
    backgroundColor: '#0088cc', 
    padding: 8, 
    borderRadius: 5 
  },
  addButtonText: { 
    color: '#fff', 
    fontSize: 14 
  },
});
