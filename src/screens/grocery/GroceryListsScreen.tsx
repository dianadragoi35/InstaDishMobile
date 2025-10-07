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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useGroceryLists } from '../../hooks/useGroceryLists';
import { GroceryStackParamList } from '../../navigation/AppNavigator';
import { GroceryList } from '../../types';

type GroceryListsScreenNavigationProp = NativeStackNavigationProp<
  GroceryStackParamList,
  'GroceryLists'
>;

/**
 * Status badge colors for different list states
 */
const STATUS_COLORS = {
  Active: {
    bg: '#DBEAFE', // Blue-100
    text: '#1E40AF', // Blue-800
    icon: 'progress-check' as const,
  },
  Completed: {
    bg: '#D1FAE5', // Green-100
    text: '#065F46', // Green-800
    icon: 'check-circle' as const,
  },
  Archived: {
    bg: '#F3F4F6', // Gray-100
    text: '#374151', // Gray-700
    icon: 'archive' as const,
  },
};

/**
 * Grocery Lists Screen
 * Shows all user grocery lists with create and manage functionality
 */
export default function GroceryListsScreen() {
  const navigation = useNavigation<GroceryListsScreenNavigationProp>();
  const { lists, isLoading, error, createListAsync, deleteListAsync, refetch } = useGroceryLists();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListNotes, setNewListNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Handle create new grocery list
   */
  const handleCreateList = async () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    try {
      setIsCreating(true);
      await createListAsync({
        name: newListName.trim(),
        notes: newListNotes.trim() || undefined,
      });

      // Clear form and close modal
      setNewListName('');
      setNewListNotes('');
      setShowCreateModal(false);

      Alert.alert('Success', 'Grocery list created successfully');
    } catch (err) {
      console.error('Failed to create grocery list:', err);
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : 'Failed to create grocery list'
      );
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Handle delete grocery list with confirmation
   */
  const handleDeleteList = (list: GroceryList) => {
    Alert.alert(
      'Delete List',
      `Are you sure you want to delete "${list.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteListAsync(list.id);
              Alert.alert('Success', 'Grocery list deleted successfully');
            } catch (err) {
              console.error('Failed to delete grocery list:', err);
              Alert.alert(
                'Error',
                err instanceof Error ? err.message : 'Failed to delete grocery list'
              );
            }
          },
        },
      ]
    );
  };

  /**
   * Handle tap on list to navigate to detail
   */
  const handleListPress = (listId: string) => {
    navigation.navigate('GroceryListDetail', { listId });
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
   * Render status badge
   */
  const renderStatusBadge = (status: 'Active' | 'Completed' | 'Archived') => {
    const colors = STATUS_COLORS[status];
    return (
      <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
        <MaterialCommunityIcons name={colors.icon} size={14} color={colors.text} />
        <Text style={[styles.statusText, { color: colors.text }]}>{status}</Text>
      </View>
    );
  };

  /**
   * Render grocery list card
   */
  const renderListCard = ({ item }: { item: GroceryList }) => (
    <TouchableOpacity
      style={styles.listCard}
      onPress={() => handleListPress(item.id)}
      onLongPress={() => handleDeleteList(item)}
    >
      <View style={styles.listContent}>
        <View style={styles.listHeader}>
          <Text style={styles.listName} numberOfLines={2}>
            {item.name}
          </Text>
          {renderStatusBadge(item.status)}
        </View>

        {item.notes && (
          <Text style={styles.listNotes} numberOfLines={2}>
            {item.notes}
          </Text>
        )}

        <View style={styles.listFooter}>
          <Text style={styles.listDate}>
            Created {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.listActions}>
        <TouchableOpacity
          onPress={() => handleDeleteList(item)}
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="delete" size={24} color="#EF4444" />
        </TouchableOpacity>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#D97706" />
        <Text style={styles.loadingText}>Loading grocery lists...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load grocery lists</Text>
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
      {lists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="format-list-checks" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No grocery lists yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the + button to create your first grocery list
          </Text>
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(item) => item.id}
          renderItem={renderListCard}
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Create List Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}
        >
          <TouchableOpacity
            style={styles.modalContent}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Grocery List</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>List Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Weekend Shopping"
                placeholderTextColor="#9CA3AF"
                value={newListName}
                onChangeText={setNewListName}
                autoFocus
                maxLength={100}
              />

              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add notes about this list..."
                placeholderTextColor="#9CA3AF"
                value={newListNotes}
                onChangeText={setNewListNotes}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCreateModal(false)}
                disabled={isCreating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, isCreating && styles.createButtonDisabled]}
                onPress={handleCreateList}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>Create</Text>
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
  listCard: {
    flexDirection: 'row',
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
  listContent: {
    flex: 1,
    marginRight: 12,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  listName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listNotes: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  listFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
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
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#D97706',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
