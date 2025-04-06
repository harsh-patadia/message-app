import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';

export default function ChatListScreen({ navigation, route }) {
  const { user } = route.params;
  const [friends, setFriends] = useState([]);

  useEffect(() => {
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
        if (response.ok) {
          setFriends(json.friends);
        } else {
          alert(json.error);
        }
      } catch (error) {
        console.error(error);
        alert('Error fetching friends');
      }
    };
    fetchFriends();
  }, []);

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
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.name}>{item.user_first_name} {item.user_last_name}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Chats</Text>

      {/* Group Chat Button */}
      <TouchableOpacity
        style={styles.groupButton}
        onPress={() => navigation.navigate('GroupList', { user })}
        activeOpacity={0.8}
      >
        <Text style={styles.groupButtonText}>Group Chats</Text>
      </TouchableOpacity>

      <FlatList
        data={friends}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 15,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#222',
  },
  groupButton: {
    backgroundColor: '#005fa3',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  groupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginBottom: 12,
    padding: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0088cc',
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
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  name: {
    fontSize: 14,
    color: '#777',
    marginTop: 2,
  },
});
