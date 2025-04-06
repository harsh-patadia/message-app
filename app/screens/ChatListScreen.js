import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ChatListScreen({ navigation, route }) {
  const { user } = route.params;
  const [friends, setFriends] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      let response = await fetch('http://127.0.0.1:5000/friends', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user.user_id,
        },
      });
      let json = await response.json();
      if (response.ok) setFriends(json.friends);
      else alert(json.error);
    } catch (error) {
      console.error(error);
      alert('Error fetching friends');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoadingSearch(true);
    try {
      let response = await fetch(`http://127.0.0.1:5000/search_users?username=${searchQuery}`, {
        headers: { 'Authorization': user.user_id },
      });
      let json = await response.json();
      if (response.ok) setSearchResults(json.users);
      else alert(json.error);
    } catch (err) {
      console.error(err);
      alert('Error searching users');
    }
    setLoadingSearch(false);
  };

  const handleAddFriend = async (friendId) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/users/add-friend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user.user_id,
        },
        body: JSON.stringify({ friend_id: friendId }),
      });
      const json = await res.json();
      if (res.ok) {
        alert('Friend added!');
        fetchFriends();
      } else {
        alert(json.error || 'Failed to add friend');
      }
    } catch (err) {
      console.error(err);
      alert('Error adding friend');
    }
  };

  const renderItem = ({ item }) => {
    const initials = `${item.user_first_name?.[0] || ''}${item.user_last_name?.[0] || ''}`.toUpperCase();
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Chat', { friend: item, user })}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.titleText}>{item.username}</Text>
          <Text style={styles.subText}>{item.user_first_name} {item.user_last_name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={friends}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.floatingButton}>
        <Ionicons name="person-add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal for Searching and Adding Friends */}
      <Modal visible={isModalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Search Users</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter username"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>

          {loadingSearch ? (
            <ActivityIndicator size="large" color="#007bff" />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.searchItem}>
                  <Text>{item.username}</Text>
                  <TouchableOpacity onPress={() => handleAddFriend(item._id)} style={styles.addButton}>
                    <Text style={styles.addButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeModal}>
            <Text style={styles.closeModalText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  listContent: { paddingBottom: 80 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#005fa3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  subText: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007bff',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9fafe',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
    color: '#333',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginVertical: 6,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  addButton: {
    backgroundColor: '#28a745',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  closeModal: {
    marginTop: 15,
    alignItems: 'center',
  },
  closeModalText: {
    fontSize: 16,
    color: 'red',
  },
});
