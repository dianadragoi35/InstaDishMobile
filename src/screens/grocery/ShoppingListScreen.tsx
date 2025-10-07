import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useShoppingList } from '../../hooks/useShoppingList';
import { Ingredient } from '../../types';

/**
 * Shopping List Screen
 * Shows all ingredients marked "need to buy" across all lists
 * Quick view for grocery shopping without specific list context
 */
export default function ShoppingListScreen() {
  const navigation = useNavigation();
  const { items, isLoading, error, toggleNeedToBuy, clearAllItems, isClearing, refetch } = useShoppingList();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Filter items based on search query
   */
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Sort items: unchecked items first, then checked items
   */
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.needToBuy === b.needToBuy) return 0;
    return a.needToBuy ? -1 : 1; // needToBuy=true comes first
  });

  /**
   * Count unchecked items (still need to buy)
   */
  const uncheckedCount = filteredItems.filter((item) => item.needToBuy).length;

  /**
   * Handle checkbox toggle
   */
  const handleToggleCheckbox = (ingredientId: string, currentStatus: boolean) => {
    toggleNeedToBuy({ ingredientId, needToBuy: !currentStatus });
  };

  /**
   * Handle pull to refresh
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  /**
   * Handle clear all items with confirmation
   */
  const handleClearAll = () => {
    if (items.length === 0) return;

    Alert.alert(
      'Clear Shopping List',
      `Remove all ${items.length} items from your shopping list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            clearAllItems();
          },
        },
      ]
    );
  };

  /**
   * Set header right button for clear all
   */
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handleClearAll}
          disabled={items.length === 0 || isClearing}
          style={styles.headerButton}
        >
          {isClearing ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <MaterialCommunityIcons
              name="delete-sweep"
              size={24}
              color={items.length === 0 ? '#D1D5DB' : '#EF4444'}
            />
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, items.length, isClearing]);

  /**
   * Render shopping list item
   */
  const renderItem = ({ item }: { item: Ingredient }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleToggleCheckbox(item.id, item.needToBuy)}
      activeOpacity={0.7}
    >
      <TouchableOpacity
        onPress={() => handleToggleCheckbox(item.id, item.needToBuy)}
        style={styles.checkbox}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialCommunityIcons
          name={item.needToBuy ? 'checkbox-blank-outline' : 'checkbox-marked'}
          size={24}
          color={item.needToBuy ? '#D1D5DB' : '#10B981'}
        />
      </TouchableOpacity>
      <Text style={[styles.itemName, !item.needToBuy && styles.itemNameChecked]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>Loading shopping list...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load shopping list</Text>
        <Text style={styles.errorSubtext}>
          {error instanceof Error ? error.message : 'Unknown error'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search ingredients..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <MaterialCommunityIcons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Item Count */}
      {items.length > 0 && (
        <View style={styles.countContainer}>
          <MaterialCommunityIcons name="cart-outline" size={20} color="#D97706" />
          <Text style={styles.countText}>
            {uncheckedCount} {uncheckedCount === 1 ? 'item' : 'items'} to buy
            {filteredItems.length > uncheckedCount && (
              <Text style={styles.countTextSecondary}>
                {' '}· {filteredItems.length - uncheckedCount} checked off
              </Text>
            )}
          </Text>
        </View>
      )}

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name={searchQuery ? 'magnify' : 'cart-outline'}
            size={64}
            color="#D1D5DB"
          />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No items found' : 'Shopping list is empty'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? 'Try a different search term'
              : 'Mark ingredients as "need to buy" to see them here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#D97706"
              colors={['#D97706']}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  errorSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#D97706',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  headerButton: {
    marginRight: 16,
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  countText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  countTextSecondary: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  checkbox: {
    marginRight: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
});
