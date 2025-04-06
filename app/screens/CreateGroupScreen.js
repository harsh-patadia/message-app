import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

export default function CreateGroupScreen({ navigation, route }) {
  const { user, onGroupCreated } = route.params; // 👈 callback received
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await fetch(`http://127.0.0.1:5000/search_users?username=${text}`, {
        headers: {
          Authorization: user.user_id,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.users.filter(u => u._id !== user.user_id));
      } else {
        console.error(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleUserSelect = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      return Alert.alert('Group name is required');
    }

    if (selectedUsers.length === 0) {
      return Alert.alert('Select at least one user');
    }

    try {
      const res = await fetch('http://127.0.0.1:5000/groups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: user.user_id,
        },
        body: JSON.stringify({
          name: groupName.trim(),
          members: selectedUsers,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert('Group created successfully!');
        if (onGroupCreated) onGroupCreated(); // ✅ trigger refresh
        navigation.goBack(); // 👈 navigate back
      } else {
        console.error(data.error);
        Alert.alert('Error', data.error || 'Could not create group');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        selectedUsers.includes(item._id) && styles.userSelected,
      ]}
      onPress={() => toggleUserSelect(item._id)}
    >
      <Text style={styles.userText}>{item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Group Name</Text>
      <TextInput
        placeholder="Enter group name"
        value={groupName}
        onChangeText={setGroupName}
        style={styles.input}
      />

      <Text style={styles.label}>Search Friends</Text>
      <TextInput
        placeholder="Search by username"
        value={searchQuery}
        onChangeText={handleSearch}
        style={styles.input}
      />

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        style={styles.userList}
      />

      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateGroup}
      >
        <Text style={styles.createButtonText}>Create Group</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f7fa' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 15, marginBottom: 5 },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  userList: { marginTop: 10, marginBottom: 20 },
  userItem: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
  },
  userSelected: {
    backgroundColor: '#d4eaff',
    borderColor: '#007bff',
    borderWidth: 1,
  },
  userText: { fontSize: 16 },
  createButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
