import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFonts, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  LogOut,
  User,
  Settings as Gear,
  HelpCircle,
  MessageCircle,
  Bell,
} from 'lucide-react-native';

import CategoryItem from '../../components/CategoryItem';
import Recommended from '../../components/Recommended';
import { useNotifications } from '../../context/NotificationContext';
import { useMenuItems } from '../../api/hooks';

const CATEGORY_IMAGES = {
  combo: require('../../../assets/choices/combo.png'),
  meals: require('../../../assets/choices/meals.png'),
  snacks: require('../../../assets/choices/snacks.png'),
  drinks: require('../../../assets/choices/drinks.png'),
};

export default function HomeDashboardScreen() {
  const [fontsLoaded] = useFonts({ Roboto_700Bold });
  const router = useRouter();
  const { notifications } = useNotifications();

  const [openDropdown, setOpenDropdown] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: menuData, isLoading: itemsLoading, isFetching: itemsFetching, refetch: refetchItems } =
    useMenuItems({ limit: 100, archived: false }, { keepPreviousData: true });

  const menuItems = useMemo(() => menuData?.items || [], [menuData?.items]);
  const isSyncing = itemsFetching;

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    refetchItems().finally(() => setRefreshing(false));
  }, [refetchItems]);

  useFocusEffect(
    useCallback(() => {
      refetchItems().catch(() => {});
    }, [refetchItems])
  );

  const FIXED_CATEGORIES = [
    { key: 'combo', title: 'Combo Meals', image: CATEGORY_IMAGES.combo },
    { key: 'meals', title: 'Meals', image: CATEGORY_IMAGES.meals },
    { key: 'snacks', title: 'Snacks', image: CATEGORY_IMAGES.snacks },
    { key: 'drinks', title: 'Drinks', image: CATEGORY_IMAGES.drinks },
  ];

  // Map category keys to backend category names
  const CATEGORY_MAP = {
    combo: 'Combo Meals',
    meals: 'Meals',
    snacks: 'Snacks',
    drinks: 'Drinks',
  };

  const categoriesData = useMemo(() => {
    return FIXED_CATEGORIES.map((cat) => {
      const itemCount = menuItems.filter(
        (item) => !item.archived && (item.category || '') === CATEGORY_MAP[cat.key]
      ).length;
      return { ...cat, itemCount };
    });
  }, [menuItems]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categoriesData;
    return categoriesData.filter((cat) =>
      cat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categoriesData, searchQuery]);

  const recommendedItems = useMemo(() => {
    if (!menuItems.length) return [];
    return menuItems.filter((item) => item && !item.archived && item.available).slice(0, 6);
  }, [menuItems]);

  const loadingCategories = itemsLoading && !categoriesData.length;

  if (!fontsLoaded) return null;

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([
        '@sanaol/auth/accessToken',
        '@sanaol/auth/refreshToken',
        '@sanaol/auth/user',
      ]);
      setOpenDropdown(null);
      router.replace('/account-login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const DropdownItem = ({ icon, label, onPress, color }) => (
    <TouchableOpacity
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 }}
      onPress={onPress}
    >
      <View style={{ width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <Text style={{ marginLeft: 8, fontSize: 14, color: color || '#374151' }}>{label}</Text>
    </TouchableOpacity>
  );

  const renderCategoriesHeader = () => (
    <View style={{ marginBottom: 8, paddingHorizontal: 8 }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Categories</Text>
      <View style={{ marginTop: 4, width: 48, height: 3, borderRadius: 2, backgroundColor: '#f97316' }} />
    </View>
  );

  const renderDropdownContainer = (children) => (
    <View style={{ position: 'absolute', top: 56, right: 16, width: 180, zIndex: 150 }}>
      <View style={{ width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderBottomWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'white', alignSelf: 'flex-end', marginRight: 8 }} />
      <View style={{ backgroundColor: 'white', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 5 }}>
        {children}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fef3c7' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, gap: 8, zIndex: 200 }}>
        <TextInput
          placeholder="Search menu..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ flex: 1, height: 40, backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 12, fontSize: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}
        />
        <TouchableOpacity onPress={() => setOpenDropdown(openDropdown === 'notifications' ? null : 'notifications')}>
          <Bell size={20} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setOpenDropdown(openDropdown === 'settings' ? null : 'settings')}>
          <Gear size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredCategories}
        extraData={filteredCategories.length}
        numColumns={2}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#f97316']} tintColor="#f97316" />}
        columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 10 }}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <CategoryItem
            image={item.image}
            title={item.title}
            onPress={() => router.push(`/categories/${encodeURIComponent(item.key)}`)}
          />
        )}
        ListHeaderComponent={
          <View style={{ marginBottom: 8 }}>
            <Recommended items={recommendedItems} />
            {renderCategoriesHeader()}
            {isSyncing && categoriesData.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8, marginTop: 4 }}>
                <ActivityIndicator size="small" color="#f97316" />
                <Text style={{ marginLeft: 8, fontSize: 12, color: '#6b7280' }}>Syncing latest menu...</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          loadingCategories ? (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 24 }}>
              <ActivityIndicator size="large" color="#f97316" />
              <Text style={{ marginTop: 8, textAlign: 'center', fontSize: 14, color: '#6b7280' }}>Loading categories...</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 8 }}
      />

      {openDropdown && <Pressable style={{ position: 'absolute', inset: 0 }} onPress={() => setOpenDropdown(null)} />}

      {openDropdown === 'settings' &&
        renderDropdownContainer(
          <>
            <DropdownItem icon={<User size={16} color="#374151" />} label="Profile" onPress={() => router.push('/tabs/account-profile')} />
            <DropdownItem icon={<Gear size={16} color="#374151" />} label="App Settings" onPress={() => router.push('screens/Settings')} />
            <DropdownItem icon={<HelpCircle size={16} color="#374151" />} label="Help" onPress={() => router.push('screens/FAQs')} />
            <DropdownItem icon={<MessageCircle size={16} color="#374151" />} label="Feedback" onPress={() => router.push('screens/Feedback')} />
            <DropdownItem icon={<LogOut size={16} color="red" />} label="Logout" onPress={handleLogout} color="red" />
          </>
        )}
    </View>
  );
}
