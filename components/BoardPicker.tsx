import React, { useState } from 'react';
import { View, StyleSheet, Text, Modal, TouchableOpacity, ScrollView, TextInput, KeyboardAvoidingView, Platform as RNPlatform } from 'react-native';
import { useMuseoStore } from '../store/useMuseoStore';
import { Plus, X, ChevronRight } from 'lucide-react-native';

interface BoardPickerProps {
  itemId: string | null;
  visible: boolean;
  onClose: () => void;
}

export const BoardPicker = ({ itemId, visible, onClose }: BoardPickerProps) => {
  const { boards, tagToBoard, createBoard } = useMuseoStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const handleCreateBoard = () => {
    if (newBoardName.trim()) {
      const boardId = createBoard(newBoardName.trim());
      if (itemId) tagToBoard(itemId, boardId);
      setNewBoardName('');
      setIsCreating(false);
      onClose();
    }
  };

  const handleSelectBoard = (boardId: string) => {
    if (itemId) {
      tagToBoard(itemId, boardId);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Tag to Board</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list}>
          {boards.filter(b => b.id !== 'all').map((board) => (
            <TouchableOpacity 
              key={board.id} 
              style={styles.boardItem}
              onPress={() => handleSelectBoard(board.id)}
            >
              <Text style={styles.boardName}>{board.name}</Text>
              <ChevronRight size={18} color="#C7C7CC" />
            </TouchableOpacity>
          ))}

          {isCreating ? (
            <KeyboardAvoidingView 
              behavior={RNPlatform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.createContainer}
            >
              <TextInput
                style={styles.input}
                placeholder="Board Name"
                value={newBoardName}
                onChangeText={setNewBoardName}
                autoFocus
              />
              <View style={styles.createActions}>
                <TouchableOpacity 
                  onPress={() => setIsCreating(false)} 
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelTxt}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleCreateBoard} 
                  style={[styles.saveBtn, !newBoardName.trim() && styles.disabledBtn]}
                  disabled={!newBoardName.trim()}
                >
                  <Text style={styles.saveTxt}>Create</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          ) : (
            <TouchableOpacity 
              style={styles.addBoardItem}
              onPress={() => setIsCreating(true)}
            >
              <Plus size={20} color="#007AFF" />
              <Text style={styles.addBoardText}>Create New Board</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C6C6C8',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  boardItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  boardName: {
    fontSize: 16,
    fontWeight: '500',
  },
  addBoardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    marginTop: 10,
  },
  addBoardText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  createContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  input: {
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#007AFF',
    marginBottom: 16,
  },
  createActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  cancelBtn: {
    padding: 8,
  },
  cancelTxt: {
    color: '#8E8E93',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledBtn: {
    backgroundColor: '#C7C7CC',
  },
  saveTxt: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
