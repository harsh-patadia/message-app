import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

export default function GroupListScreen({ navigation, route }) {
  const { user } = route.params;
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        let res = await fetch('http://127.0.0.1:5000/groups', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': user.user_id,
          },
        });
        let json = await res.json();
        if (res.ok) {
          setGroups(json.groups);
        } else {
          alert(json.error);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to fetch groups');
      }
    };
    fetchGroups();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('GroupChat', { group: item, user })}
      activeOpacity={0.8}
    >
      <Text style={styles.groupName}>{item.name}</Text>
      <Text style={styles.membersCount}>{item.members.length} members</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Group Chats</Text>
      <FlatList
        data={groups}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f7f9fc' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#222' },
  item: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    elevation: 2,
  },
  groupName: { fontSize: 18, fontWeight: '600' },
  membersCount: { color: '#666', marginTop: 4 },
});
