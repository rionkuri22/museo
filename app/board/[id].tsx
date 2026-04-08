import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView } from 'react-native';
import { useMuseoStore } from '../../store/useMuseoStore';
import { EmbedCard } from '../../components/EmbedCard';
import { BoardPicker } from '../../components/BoardPicker';
import { OfflineBanner } from '../../components/OfflineBanner';
import { useLocalSearchParams, Stack, Href } from 'expo-router';
import { ContentItem, getDynamicHeight, isFullWidth } from '../../utils/share-utils';

export default function BoardDetailView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { items, boards, removeItem } = useMuseoStore();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [boardPickerVisible, setBoardPickerVisible] = useState(false);

  const board = boards.find(b => b.id === id);
  const boardItems = id === 'all' 
    ? items 
    : items.filter(item => item.boardIds.includes(id as string));

  const handleTag = (id: string) => {
    setSelectedItemId(id);
    setBoardPickerVisible(true);
  };

  const handleDelete = (id: string) => {
    removeItem(id);
  };

  if (!board) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Board not found</Text>
      </View>
    );
  }

  // Build mixed layout same as landing page
  type LayoutRow = { type: 'full'; item: ContentItem } | { type: 'pair'; left: ContentItem[]; right: ContentItem[] };
  const rows: LayoutRow[] = [];
  let halfWidthBuffer: ContentItem[] = [];

  const flushBuffer = () => {
    if (halfWidthBuffer.length === 0) return;
    const left: ContentItem[] = [];
    const right: ContentItem[] = [];
    let leftH = 0;
    let rightH = 0;
    halfWidthBuffer.forEach(item => {
      const h = getDynamicHeight(item.platform);
      if (leftH <= rightH) {
        left.push(item);
        leftH += h;
      } else {
        right.push(item);
        rightH += h;
      }
    });
    rows.push({ type: 'pair', left, right });
    halfWidthBuffer = [];
  };

  boardItems.forEach(item => {
    if (isFullWidth(item.platform)) {
      flushBuffer();
      rows.push({ type: 'full', item });
    } else {
      halfWidthBuffer.push(item);
    }
  });
  flushBuffer();

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      <Stack.Screen options={{ title: board.name }} />
      
      {boardItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>This board is empty</Text>
          <Text style={styles.emptySubtitle}>Go to your main board and tag some content here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {rows.map((row, rowIdx) => {
            if (row.type === 'full') {
              return (
                <EmbedCard
                  key={row.item.id}
                  item={row.item}
                  onDelete={handleDelete}
                  onTag={handleTag}
                  customWidth="100%"
                />
              );
            } else {
              return (
                <View key={`pair-${rowIdx}`} style={styles.masonryContainer}>
                  <View style={styles.column}>
                    {row.left.map(item => (
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
                    {row.right.map(item => (
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
              );
            }
          })}
        </ScrollView>
      )}
      
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
