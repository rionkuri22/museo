import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ContentItem } from '../../utils/share-utils';
import { useMuseoStore } from '../../store/useMuseoStore';
import { EmbedCard } from '../../components/EmbedCard';
import { BoardPicker } from '../../components/BoardPicker';
import { OfflineBanner } from '../../components/OfflineBanner';

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

  const leftColumn = items.filter((_, i) => i % 2 === 0);
  const rightColumn = items.filter((_, i) => i % 2 !== 0);

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.masonryContainer}>
          <View style={styles.column}>
            {leftColumn.map(item => (
              <EmbedCard 
                key={item.id}
                item={item} 
                onDelete={handleDelete}
                onTag={handleTag}
                customWidth="100%"
              />
            ))}
          </View>
          <View style={styles.column}>
            {rightColumn.map(item => (
              <EmbedCard 
                key={item.id}
                item={item} 
                onDelete={handleDelete}
                onTag={handleTag}
                customWidth="100%"
              />
            ))}
          </View>
        </View>
      </ScrollView>

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
  scrollContent: {
    padding: 6,
  },
  masonryContainer: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 100,
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
