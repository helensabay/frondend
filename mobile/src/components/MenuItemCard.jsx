import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function MenuItemCard({ item }) {
  return (
    <View style={styles.card}>
      {item.image && <Image source={{ uri: item.image }} style={styles.image} />}
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>${item.price}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 16, padding: 12, backgroundColor: '#fff', borderRadius: 8, elevation: 2 },
  image: { width: '100%', height: 150, borderRadius: 8, marginBottom: 8 },
  name: { fontSize: 16, fontWeight: 'bold' },
  price: { fontSize: 14, color: '#888' },
});
