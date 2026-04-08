import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { useMuseoStore } from '../../store/useMuseoStore';
import { ChevronRight, Play, Camera, Music, Bookmark, Send, Globe, Folder } from 'lucide-react-native';
import { router, Href } from 'expo-router';
import { Platform } from '../../utils/share-utils';

const PlatformIcon = ({ platform, size = 20 }: { platform: Platform; size?: number }) => {
  switch (platform) {
    case 'youtube': return <Play size={size} color="#FF0000" />;
    case 'instagram': return <Camera size={size} color="#E1306C" />;
    case 'tiktok': return <Music size={size} color="#000000" />;
    case 'pinterest': return <Bookmark size={size} color="#BD081C" />;
    case 'twitter': return <Send size={size} color="#1DA1F2" />;
    default: return <Globe size={size} color="#007AFF" />;
  }
};

export default function StatsPage() {
  const { getStats, boards } = useMuseoStore();
  const stats = getStats();
  const totalItems = Object.values(stats).reduce((a, b) => a + b, 0);

  const platformList = Object.entries(stats).filter(([_, count]) => count > 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stats</Text>
        <View style={styles.statsCard}>
          <Text style={styles.totalLabel}>Total Items Shared</Text>
          <Text style={styles.totalValue}>{totalItems}</Text>
          
          <View style={styles.platformGrid}>
            {platformList.map(([platform, count]) => (
              <View key={platform} style={styles.platformItem}>
                <PlatformIcon platform={platform as Platform} size={16} />
                <Text style={styles.platformName}>
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                </Text>
                <Text style={styles.platformCount}>{count}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Boards</Text>
        <View style={styles.boardList}>
          {boards.map((board) => (
            <TouchableOpacity 
              key={board.id} 
              style={styles.boardItem}
              onPress={() => router.push(`/board/${board.id}` as Href)}
            >
              <View style={styles.boardInfo}>
                <Folder size={22} color="#007AFF" fill="#007AFF20" />
                <View>
                  <Text style={styles.boardName}>{board.name}</Text>
                  <Text style={styles.boardCount}>{board.itemIds.length} items</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 20,
    gap: 30,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginLeft: 4,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  totalLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 34,
    fontWeight: '800',
    color: '#000',
    marginTop: 4,
    marginBottom: 20,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  platformName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  platformCount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#007AFF',
  },
  boardList: {
    gap: 12,
  },
  boardItem: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  boardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  boardName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  boardCount: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
});
