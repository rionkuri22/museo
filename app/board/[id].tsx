import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Share, Alert, TouchableOpacity } from 'react-native';
import { useMuseoStore } from '../../store/useMuseoStore';
import { EmbedCard } from '../../components/EmbedCard';
import { BoardPicker } from '../../components/BoardPicker';
import { OfflineBanner } from '../../components/OfflineBanner';
import { useLocalSearchParams, Stack, Href } from 'expo-router';
import { getDynamicHeight, isFullWidth, ContentItem } from '../../utils/share-utils';
import { Share2 } from 'lucide-react-native';

const NUM_COLUMNS = 2;

function useMasonryLayout(items: ContentItem[]) {
  return useMemo(() => {
    type Section =
      | { kind: 'masonry'; columns: ContentItem[][] }
      | { kind: 'full'; item: ContentItem };

    const sections: Section[] = [];
    let halfBuffer: ContentItem[] = [];

    const flushHalf = () => {
      if (halfBuffer.length === 0) return;

      // Make single items full-width to fill space
      if (halfBuffer.length === 1) {
        sections.push({ kind: 'full', item: halfBuffer[0] });
        halfBuffer = [];
        return;
      }

      const columns: ContentItem[][] = Array.from({ length: NUM_COLUMNS }, () => []);
      
      // Preserve chronological order
      halfBuffer.forEach((item, idx) => {
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

  const handleShare = async () => {
    if (!board || boardItems.length === 0) return;

    const linksList = boardItems
      .map((item, index) => `${index + 1}. ${item.title || 'Untitled'}\n   ${item.url}`)
      .join('\n\n');

    const message = `Check out my Museo board: ${board.name}\n\n${linksList}\n\nShared from Museo`;

    try {
      await Share.share({
        message,
        title: `Museo Board: ${board.name}`,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const sections = useMasonryLayout(boardItems);

  if (!board) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Board not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <OfflineBanner />
      <Stack.Screen 
        options={{ 
          title: board.name,
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} style={{ marginRight: 8 }}>
              <Share2 size={24} color="#007AFF" />
            </TouchableOpacity>
          )
        }} 
      />
      
      {boardItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>This board is empty</Text>
          <Text style={styles.emptySubtitle}>Go to your main board and tag some content here.</Text>
        </View>
      ) : (
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
