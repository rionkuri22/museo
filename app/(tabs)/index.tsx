import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView } from 'react-native';
import { ContentItem, getDynamicHeight, isFullWidth } from '../../utils/share-utils';
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

  // Build a mixed layout: full-width items break out, smaller items go into 2-col masonry
  type LayoutRow = { type: 'full'; item: ContentItem } | { type: 'pair'; left: ContentItem[]; right: ContentItem[] };
  const rows: LayoutRow[] = [];

  // Collect items into groups: full-width items get their own row,
  // consecutive half-width items get grouped into masonry pairs
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

  items.forEach(item => {
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
