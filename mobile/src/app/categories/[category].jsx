import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { fetchMenuItems } from '../../api/api';

export default function CategoryScreen({ params }) {
  const selectedCategory = params?.category || null;
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({}); // store items by id with quantity

  // Add to cart
  const addToCart = (item) => {
    setCart((prev) => {
      const currentQty = prev[item.id]?.quantity || 0;
      return { ...prev, [item.id]: { ...item, quantity: currentQty + 1 } };
    });
    Alert.alert('Added to Cart', `${item.name} has been added to your cart.`);
  };

  // Change quantity
  const changeQuantity = (itemId, delta) => {
    setCart((prev) => {
      const currentQty = prev[itemId]?.quantity || 0;
      const newQty = currentQty + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: { ...prev[itemId], quantity: newQty } };
    });
  };

  // Order now
  const orderNow = (item) => {
    const quantity = cart[item.id]?.quantity || 1;
    Alert.alert('Order Now', `Ordering ${quantity} x ${item.name} now!`);
  };

  useEffect(() => {
    const loadMenu = async () => {
      setLoading(true);
      try {
        const data = await fetchMenuItems();
        const items = Array.isArray(data) ? data : [];

        // Filter items by selected category
        const filteredItems = selectedCategory
          ? items.filter(
              (item) =>
                (item.category || '').toLowerCase() ===
                selectedCategory.toLowerCase()
            )
          : items;

        // Group items by category (even if only one category)
        const grouped = filteredItems.reduce((acc, item) => {
          const cat = item.category || 'Uncategorized';
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(item);
          return acc;
        }, {});

        const sectionData = Object.keys(grouped).map((key) => ({
          title: key,
          data: grouped[key],
        }));

        setSections(sectionData);
      } catch (err) {
        console.error('Error fetching menu items:', err);
        setSections([]);
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, [selectedCategory]);

  const renderItem = ({ item }) => {
    const quantity = cart[item.id]?.quantity || 0;

    return (
      <View style={styles.card}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.itemImage} />
        ) : (
          <View style={styles.placeholderImage} />
        )}

        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.price}>₱ {item.price}</Text>
        </View>

        {/* Quantity selector */}
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            onPress={() => changeQuantity(item.id, -1)}
            style={styles.qtyButton}
          >
            <Text style={styles.qtyText}>-</Text>
          </TouchableOpacity>

          <Text style={{ marginHorizontal: 8, fontSize: 16 }}>{quantity}</Text>

          <TouchableOpacity
            onPress={() => changeQuantity(item.id, 1)}
            style={styles.qtyButton}
          >
            <Text style={styles.qtyText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Add to Cart & Order Now */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            onPress={() => addToCart(item)}
            style={[styles.actionButton, { backgroundColor: '#f97316' }]}
          >
            <Text style={styles.buttonText}>Add to Cart</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => orderNow(item)}
            style={[styles.actionButton, { backgroundColor: '#10b981' }]}
          >
            <Text style={styles.buttonText}>Order Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );

  if (!sections.length)
    return (
      <View style={styles.centered}>
        <Text>No menu items found.</Text>
      </View>
    );

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      renderSectionHeader={({ section: { title } }) => (
        <Text style={styles.sectionHeader}>{title}</Text>
      )}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  list: { padding: 16 },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
    color: '#111827',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  placeholderImage: { width: 60, height: 60, backgroundColor: '#f0f0f0', borderRadius: 8, marginRight: 12 },
  name: { fontSize: 16, fontWeight: '700' },
  price: { fontSize: 14, color: '#6b7280' },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8 },
  qtyButton: { paddingHorizontal: 6, paddingVertical: 2, backgroundColor: '#eee', borderRadius: 4 },
  qtyText: { fontSize: 16 },
  buttonsContainer: { flexDirection: 'column', gap: 4 },
  actionButton: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6, marginTop: 4 },
  buttonText: { color: 'white', fontWeight: '700' },
});
