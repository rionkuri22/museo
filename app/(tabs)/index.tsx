import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Dimensions } from 'react-native';
import { getDynamicHeight, isFullWidth, ContentItem } from '../../utils/share-utils';
import { useMuseoStore } from '../../store/useMuseoStore';
import { EmbedCard } from '../../components/EmbedCard';
import { BoardPicker } from '../../components/BoardPicker';
import { OfflineBanner } from '../../components/OfflineBanner';

const NUM_COLUMNS = 2;

/**
 * Pinterest-style masonry layout.
 * Separates full-width items from half-width items, then distributes
 * half-width items into columns by always placing into the shortest column.
 * Renders the final feed in visual order: groups of masonry cards
 * interspersed with full-width cards at their original positions.
 */
function useMasonryLayout(items: ContentItem[]) {
  return useMemo(() => {
    type Section =
      | { kind: 'masonry'; columns: ContentItem[][] }
      | { kind: 'full'; item: ContentItem };

    const sections: Section[] = [];
    let halfBuffer: ContentItem[] = [];

    const flushHalf = () => {
      if (halfBuffer.length === 0) return;

      // If only one half-width item, just make it full-width to fill space
      if (halfBuffer.length === 1) {
        sections.push({ kind: 'full', item: halfBuffer[0] });
        halfBuffer = [];
        return;
      }

      const columns: ContentItem[][] = Array.from({ length: NUM_COLUMNS }, () => []);
      const colHeights: number[] = new Array(NUM_COLUMNS).fill(0);

      // Preserving chronological order (no sort)
      halfBuffer.forEach((item, idx) => {
        // Simple alternate distribution to keep order predictable but balanced
        const targetCol = idx % NUM_COLUMNS;
        columns[targetCol].push(item);
      });

      sections.push({ kind: 'masonry', columns });
      halfBuffer = [];
    };

    items.forEach(item => {
      if (isFullWidth(item.platform)) {
        flushHalf();
        sections.push({ kind: 'full', item });
      } else {
        halfBuffer.push(item);
      }
    });
    flushHalf();

    return sections;
  }, [items]);
}

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

  const sections = useMasonryLayout(items);

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
      <OfflineBanner />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, idx) => {
          if (section.kind === 'full') {
            return (
              <EmbedCard
                key={section.item.id}
                item={section.item}
                onDelete={handleDelete}
                onTag={handleTag}
                customWidth="100%"
              />
            );
          }

          return (
            <View key={`masonry-${idx}`} style={styles.masonryRow}>
              {section.columns.map((colItems, colIdx) => (
                <View key={`col-${colIdx}`} style={styles.masonryColumn}>
                  {colItems.map(item => (
                    <EmbedCard
                      key={item.id}
                      item={item}
                      onDelete={handleDelete}
                      onTag={handleTag}
                      customWidth="100%"
                    />
                  ))}
                </View>
              ))}
            </View>
          );
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
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 20,
  },
  masonryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  masonryColumn: {
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
