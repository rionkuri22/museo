import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ContentItem } from '../../utils/share-utils';
import { useMuseoStore } from '../../store/useMuseoStore';
import { EmbedCard } from '../../components/EmbedCard';
import { BoardPicker } from '../../components/BoardPicker';

export default function LandingPage() {
  const { items, removeItem } = useMuseoStore();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [boardPickerVisible, setBoardPickerVisible] = useState(false);

  const handleTag = (id: string) => {
    setSelectedItemId(id);
    setBoardPickerVisible(true);
  };

  const handleDelete = (id: string) => {
    removeItem(id);
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Your board is empty</Text>
        <Text style={styles.emptySubtitle}>Pasted links will appear here.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlashList
        data={items}
        numColumns={2}
        keyExtractor={(item: ContentItem) => item.id}
        renderItem={({ item }: { item: ContentItem }) => (
          <EmbedCard 
            item={item} 
            onDelete={handleDelete}
            onTag={handleTag}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
      
      <BoardPicker
        itemId={selectedItemId}
        visible={boardPickerVisible}
        onClose={() => setBoardPickerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContent: {
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
