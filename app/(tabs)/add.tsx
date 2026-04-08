import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform as RNPlatform, ScrollView } from 'react-native';
import { useMuseoStore } from '../../store/useMuseoStore';
import { isValidUrl, getEmbedUrl, detectPlatform } from '../../utils/share-utils';
import { Link as LinkIcon, Send } from 'lucide-react-native';
import { router } from 'expo-router';

export default function AddContentPage() {
  const [url, setUrl] = useState('');
  const { addItem } = useMuseoStore();

  const handleAdd = () => {
    if (!url.trim()) return;

    if (!isValidUrl(url.trim())) {
      Alert.alert('Oops!', 'Museo only supports links.');
      return;
    }

    const embedUrl = getEmbedUrl(url.trim());
    const platform = detectPlatform(url.trim());
    
    addItem({
      id: Math.random().toString(36).substring(7),
      url: url.trim(),
      embedUrl: embedUrl,
      platform: platform,
      title: 'New Content',
      addedAt: Date.now(),
      boardIds: [],
    });

    setUrl('');
    router.replace('/');
  };

  return (
    <KeyboardAvoidingView 
      behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <LinkIcon size={48} color="#007AFF" strokeWidth={1.5} />
          <Text style={styles.title}>Add New Content</Text>
          <Text style={styles.subtitle}>Paste any link to save it to your board.</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          
          <TouchableOpacity 
            style={[styles.button, !url.trim() && styles.buttonDisabled]} 
            onPress={handleAdd}
            disabled={!url.trim()}
          >
            <Send size={20} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.buttonText}>Add to Museo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tips}>
          <Text style={styles.tipTitle}>Works best with</Text>
          <View style={styles.chipContainer}>
            {['YouTube', 'Instagram', 'TikTok', 'Pinterest', 'X/Twitter', 'LinkedIn', 'Any URL'].map((p) => (
              <View key={p} style={[styles.chip, p === 'Any URL' && styles.chipHighlight]}>
                <Text style={[styles.chipText, p === 'Any URL' && styles.chipTextHighlight]}>{p}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  inputContainer: {
    gap: 16,
  },
  input: {
    backgroundColor: '#F2F2F7',
    padding: 18,
    borderRadius: 14,
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  tips: {
    marginTop: 60,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipHighlight: {
    backgroundColor: '#007AFF15',
    borderWidth: 1,
    borderColor: '#007AFF40',
  },
  chipText: {
    fontSize: 14,
    color: '#3A3A3C',
    fontWeight: '500',
  },
  chipTextHighlight: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
