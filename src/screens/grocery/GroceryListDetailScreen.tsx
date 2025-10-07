import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useGroceryListItems } from '../../hooks/useGroceryLists';
import { groceryService } from '../../services/groceryService';
import { ingredientService } from '../../services/ingredientService';
import { GroceryStackParamList } from '../../navigation/AppNavigator';
import { GroceryList, Ingredient } from '../../types';

type GroceryListDetailScreenRouteProp = RouteProp<GroceryStackParamList, 'GroceryListDetail'>;
type GroceryListDetailScreenNavigationProp = NativeStackNavigationProp<
  GroceryStackParamList,
  'GroceryListDetail'
>;

/**
 * Grocery List Detail Screen
 * Shows items in a grocery list with add/remove/check functionality
 */
export default function GroceryListDetailScreen() {
  const route = useRoute<GroceryListDetailScreenRouteProp>();
  const navigation = useNavigation<GroceryListDetailScreenNavigationProp>();
  const queryClient = useQueryClient();
  const { listId } = route.params;

  // State
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch grocery list details
  const {
    data: list,
    isLoading: isLoadingList,
    error: listError,
  } = useQuery({
    queryKey: ['groceryList', listId],
    queryFn: async () => {
      const lists = await groceryService.getGroceryLists();
      const foundList = lists.find((l) => l.id === listId);
      if (!foundList) {
        throw new Error('Grocery list not found');
      }
      return foundList;
    },
  });

  // Fetch list items
  const {
    items,
    isLoading: isLoadingItems,
    error: itemsError,
    togglePurchased,
    addItemAsync,
    removeItemAsync,
    refetch,
  } = useGroceryListItems(listId);

  // Search ingredients for autocomplete
  const {
    data: searchResults = [],
    isLoading: isSearching,
  } = useQuery({
    queryKey: ['ingredientSearch', searchQuery],
    queryFn: () => ingredientService.searchIngredients(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  /**
   * Handle checkbox toggle
   */
  const handleToggleCheckbox = (itemId: string, currentStatus: boolean) => {
    togglePurchased({ itemId, isPurchased: !currentStatus });
  };

  /**
   * Handle status change
   */
  const handleStatusChange = async (newStatus: 'Active' | 'Completed' | 'Archived') => {
    if (!list) return;

    try {
      await groceryService.updateListStatus(listId, newStatus);
      queryClient.invalidateQueries({ queryKey: ['groceryList', listId] });
      queryClient.invalidateQueries({ queryKey: ['groceryLists'] });
      Alert.alert('Success', `List status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update status:', err);
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to update list status'
      );
    }
  };

  /**
   * Handle add ingredient
   */
  const handleAddIngredient = async () => {
    if (!selectedIngredient) {
      Alert.alert('Error', 'Please select an ingredient');
      return;
    }

    try {
      setIsAdding(true);
      await addItemAsync({
        ingredientId: selectedIngredient.id,
        quantity: quantity.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Clear form and close modal
      setSelectedIngredient(null);
      setSearchQuery('');
      setQuantity('');
      setNotes('');
      setShowAddModal(false);

      Alert.alert('Success', 'Ingredient added to list');
    } catch (err) {
      console.error('Failed to add ingredient:', err);
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to add ingredient'
      );
    } finally {
      setIsAdding(false);
    }
  };

  /**
   * Handle remove item with confirmation
   */
  const handleRemoveItem = (itemId: string, ingredientName: string) => {
    Alert.alert(
      'Remove Item',
      `Remove "${ingredientName}" from this list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeItemAsync(itemId);
              Alert.alert('Success', 'Item removed from list');
            } catch (err) {
              console.error('Failed to remove item:', err);
              Alert.alert(
                'Error',
                err instanceof Error ? err.message : 'Failed to remove item'
              );
            }
          },
        },
      ]
    );
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
   * Handle select ingredient from search results
   */
  const handleSelectIngredient = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setSearchQuery(ingredient.name);
  };

  // Set header right button for status control
  React.useLayoutEffect(() => {
    if (list) {
      navigation.setOptions({
        headerRight: () => (
          <View style={styles.headerRight}>
            <Picker
              selectedValue={list.status}
              onValueChange={(value) => handleStatusChange(value as any)}
              style={styles.statusPicker}
              itemStyle={styles.statusPickerItem}
            >
              <Picker.Item label="Active" value="Active" />
              <Picker.Item label="Completed" value="Completed" />
              <Picker.Item label="Archived" value="Archived" />
            </Picker>
          </View>
        ),
      });
    }
  }, [navigation, list]);

  // Loading state
  if (isLoadingList || isLoadingItems) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>Loading grocery list...</Text>
      </View>
    );
  }

  // Error state
  if (listError || itemsError) {
    const error = listError || itemsError;
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load grocery list</Text>
        <Text style={styles.errorSubtext}>
          {error instanceof Error ? error.message : 'Unknown error'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            queryClient.invalidateQueries({ queryKey: ['groceryList', listId] });
            refetch();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // List not found
  if (!list) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="format-list-checks" size={64} color="#D1D5DB" />
        <Text style={styles.errorText}>List not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* List Header */}
      <View style={styles.header}>
        <Text style={styles.listName}>{list.name}</Text>
        {list.notes && <Text style={styles.listNotes}>{list.notes}</Text>}
        <View style={styles.itemsCount}>
          <MaterialCommunityIcons name="cart" size={16} color="#6B7280" />
          <Text style={styles.itemsCountText}>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Text>
        </View>
      </View>

      {/* Items List */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="cart-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No items in this list</Text>
          <Text style={styles.emptySubtext}>Tap the + button to add ingredients</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#D97706"
              colors={['#D97706']}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => handleToggleCheckbox(item.id, item.isPurchased)}
              >
                <MaterialCommunityIcons
                  name={item.isPurchased ? 'checkbox-marked' : 'checkbox-blank-outline'}
                  size={24}
                  color={item.isPurchased ? '#10B981' : '#D1D5DB'}
                />
              </TouchableOpacity>

              <View style={styles.itemContent}>
                <Text
                  style={[
                    styles.itemName,
                    item.isPurchased && styles.itemNamePurchased,
                  ]}
                >
                  {item.ingredient.name}
                </Text>
                {item.quantity && (
                  <Text style={styles.itemQuantity}>{item.quantity}</Text>
                )}
                {item.notes && <Text style={styles.itemNotes}>{item.notes}</Text>}
              </View>

              <TouchableOpacity
                onPress={() => handleRemoveItem(item.id, item.ingredient.name)}
                style={styles.removeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="close-circle" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddModal(true)}>
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add Ingredient Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAddModal(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Ingredient</Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Search Ingredient *</Text>
              <TextInput
                style={styles.input}
                placeholder="Start typing to search..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />

              {/* Search Results */}
              {searchQuery.length >= 2 && (
                <View style={styles.searchResults}>
                  {isSearching ? (
                    <ActivityIndicator size="small" color="#D97706" />
                  ) : searchResults.length === 0 ? (
                    <Text style={styles.noResults}>No ingredients found</Text>
                  ) : (
                    searchResults.map((ingredient) => (
                      <TouchableOpacity
                        key={ingredient.id}
                        style={[
                          styles.searchResultItem,
                          selectedIngredient?.id === ingredient.id &&
                            styles.searchResultItemSelected,
                        ]}
                        onPress={() => handleSelectIngredient(ingredient)}
                      >
                        <Text style={styles.searchResultText}>{ingredient.name}</Text>
                        {selectedIngredient?.id === ingredient.id && (
                          <MaterialCommunityIcons
                            name="check"
                            size={20}
                            color="#D97706"
                          />
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {selectedIngredient && (
                <>
                  <Text style={styles.inputLabel}>Quantity (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 2 cups, 500g"
                    placeholderTextColor="#9CA3AF"
                    value={quantity}
                    onChangeText={setQuantity}
                    maxLength={100}
                  />

                  <Text style={styles.inputLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="e.g., fresh, organic"
                    placeholderTextColor="#9CA3AF"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={2}
                    maxLength={200}
                  />
                </>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
                disabled={isAdding}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.addButton,
                  (!selectedIngredient || isAdding) && styles.addButtonDisabled,
                ]}
                onPress={handleAddIngredient}
                disabled={!selectedIngredient || isAdding}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.addButtonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
  headerRight: {
    marginRight: 8,
  },
  statusPicker: {
    width: 140,
    height: 40,
    color: '#111827',
  },
  statusPickerItem: {
    fontSize: 16,
    color: '#111827',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  listName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  listNotes: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  itemsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemsCountText: {
    fontSize: 14,
    color: '#6B7280',
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
    padding: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemNamePurchased: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#D97706',
    fontWeight: '500',
    marginBottom: 2,
  },
  itemNotes: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  removeButton: {
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 8,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  searchResults: {
    maxHeight: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  searchResultItemSelected: {
    backgroundColor: '#FEF3C7',
  },
  searchResultText: {
    fontSize: 14,
    color: '#111827',
  },
  noResults: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#D97706',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
