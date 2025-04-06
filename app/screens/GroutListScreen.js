import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function GroupListScreen({ navigation, route }) {
  const { user } = route.params;
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/groups', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': user.user_id,
        },
      });
      const json = await res.json();
      if (res.ok) setGroups(json.groups);
      else alert(json.error);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch groups');
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('GroupChat', { group: item, user })}
      activeOpacity={0.8}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.name[0]}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.titleText}>{item.name}</Text>
        <Text style={styles.subText}>{item.members.length} members</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={groups}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Add Group Button */}
      <TouchableOpacity
        style={styles.addGroupButton}
        onPress={() => navigation.navigate('CreateGroup', { user, onGroupCreated: fetchGroups })}
      >
        <Ionicons name="add-circle" size={60} color="#007bff" />
      </TouchableOpacity>
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
    shadowOpacity: 0.1,
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
  addGroupButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: '#fff',
    borderRadius: 30,
    elevation: 5,
  },
});
