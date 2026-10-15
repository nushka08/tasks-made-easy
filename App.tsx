import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// --- Types & Constants ---
type Priority = 'low' | 'medium' | 'high';
type Category = 'Work' | 'Personal' | 'Study' | 'Health';
type FilterStatus = 'all' | 'active' | 'completed';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  createdAt: number;
}

const STORAGE_KEY = '@tasks_data_v2';
const THEME_KEY = '@app_theme_mode';

const CATEGORIES: Category[] = ['Work', 'Personal', 'Study', 'Health'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high'];

const CATEGORY_COLORS: Record<Category, { bg: string; text: string }> = {
  Work: { bg: '#e0e7ff', text: '#4338ca' },
  Personal: { bg: '#fce7f3', text: '#be185d' },
  Study: { bg: '#e0f2fe', text: '#0369a1' },
  Health: { bg: '#dcfce7', text: '#15803d' },
};

const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
};

// --- Theme Palettes ---
const themes = {
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    subtext: '#64748b',
    border: '#e2e8f0',
    inputBg: '#f1f5f9',
    cardShadow: '#0f172a',
    accent: '#6366f1',
    accentText: '#ffffff',
  },
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f8fafc',
    subtext: '#94a3b8',
    border: '#334155',
    inputBg: '#0b1329',
    cardShadow: '#000000',
    accent: '#818cf8',
    accentText: '#0f172a',
  },
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Work');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('medium');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'All'>('All');

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const currentTheme = isDarkMode ? themes.dark : themes.light;

  // Load tasks & theme on startup
  useEffect(() => {
    loadData();
  }, []);

  // Save tasks on changes
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)).catch((err) =>
      console.error(err)
    );
  }, [tasks]);

  const loadData = async () => {
    try {
      const [savedTasks, savedTheme] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(THEME_KEY),
      ]);
      if (savedTasks) setTasks(JSON.parse(savedTasks));
      if (savedTheme) setIsDarkMode(savedTheme === 'dark');
    } catch {
      Alert.alert('Error', 'Failed to load app data.');
    }
  };

  const toggleTheme = async () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    await AsyncStorage.setItem(THEME_KEY, nextTheme ? 'dark' : 'light');
  };

  const handleAddTask = () => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      Alert.alert('Empty Task', 'Please enter a task description.');
      return;
    }

    const newTask: Task = {
      id: Date.now().toString(),
      text: trimmed,
      completed: false,
      category: selectedCategory,
      priority: selectedPriority,
      createdAt: Date.now(),
    };

    setTasks([newTask, ...tasks]);
    setInputText('');
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // Filter & Search Logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.text
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        activeFilter === 'all'
          ? true
          : activeFilter === 'active'
          ? !task.completed
          : task.completed;
      const matchesCategory =
        categoryFilter === 'All' ? true : task.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [tasks, searchQuery, activeFilter, categoryFilter]);

  const completedCount = tasks.filter((t) => t.completed).length;

  const renderTaskItem = ({ item }: { item: Task }) => {
    const catStyle = CATEGORY_COLORS[item.category];
    const priorityColor = PRIORITY_COLORS[item.priority];

    return (
      <View
        style={[
          styles.taskCard,
          {
            backgroundColor: currentTheme.surface,
            shadowColor: currentTheme.cardShadow,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.taskContent}
          activeOpacity={0.7}
          onPress={() => toggleTaskCompletion(item.id)}
        >
          {/* Checkbox */}
          <View
            style={[
              styles.checkbox,
              { borderColor: currentTheme.border },
              item.completed && {
                backgroundColor: currentTheme.accent,
                borderColor: currentTheme.accent,
              },
            ]}
          >
            {item.completed && (
              <Ionicons name="checkmark" size={14} color="#ffffff" />
            )}
          </View>

          <View style={styles.textContainer}>
            <Text
              style={[
                styles.taskText,
                { color: currentTheme.text },
                item.completed && styles.taskTextCompleted,
              ]}
            >
              {item.text}
            </Text>

            {/* Tags row */}
            <View style={styles.tagRow}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: catStyle.bg },
                ]}
              >
                <Text style={[styles.categoryBadgeText, { color: catStyle.text }]}>
                  {item.category}
                </Text>
              </View>

              <View style={styles.priorityIndicator}>
                <View
                  style={[
                    styles.priorityDot,
                    { backgroundColor: priorityColor },
                  ]}
                />
                <Text
                  style={[
                    styles.priorityText,
                    { color: currentTheme.subtext },
                  ]}
                >
                  {item.priority.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteTask(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={currentTheme.background}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: currentTheme.text }]}>
              Tasks
            </Text>
            <Text style={[styles.subtitle, { color: currentTheme.subtext }]}>
              {completedCount} of {tasks.length} completed
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.themeToggle,
              { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
            ]}
            onPress={toggleTheme}
          >
            <Ionicons
              name={isDarkMode ? 'sunny-outline' : 'moon-outline'}
              size={20}
              color={isDarkMode ? '#fbbf24' : '#6366f1'}
            />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: currentTheme.inputBg,
                borderColor: currentTheme.border,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={currentTheme.subtext}
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={[styles.searchInput, { color: currentTheme.text }]}
              placeholder="Search tasks..."
              placeholderTextColor={currentTheme.subtext}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={currentTheme.subtext}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Status Filter Tabs (All / Active / Done) */}
        <View style={styles.statusTabs}>
          {(['all', 'active', 'completed'] as FilterStatus[]).map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.statusTab,
                  isActive && {
                    backgroundColor: currentTheme.accent,
                  },
                ]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text
                  style={[
                    styles.statusTabText,
                    { color: isActive ? '#ffffff' : currentTheme.subtext },
                  ]}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Category Filter Horizontal Scroll */}
        <View style={styles.categoryFilterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryFilterContainer}
          >
            {(['All', ...CATEGORIES] as (Category | 'All')[]).map((cat) => {
              const isSelected = categoryFilter === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catFilterChip,
                    {
                      backgroundColor: isSelected
                        ? currentTheme.accent
                        : currentTheme.surface,
                      borderColor: currentTheme.border,
                    },
                  ]}
                  onPress={() => setCategoryFilter(cat)}
                >
                  <Text
                    style={[
                      styles.catFilterText,
                      { color: isSelected ? '#ffffff' : currentTheme.subtext },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Task List */}
        <FlatList
          data={filteredTasks}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="clipboard-outline"
                size={48}
                color={currentTheme.subtext}
              />
              <Text
                style={[styles.emptyText, { color: currentTheme.subtext }]}
              >
                No tasks found
              </Text>
            </View>
          }
        />

        {/* Task Creator Card */}
        <View
          style={[
            styles.createSection,
            {
              backgroundColor: currentTheme.surface,
              borderTopColor: currentTheme.border,
            },
          ]}
        >
          {/* Category & Priority Selectors */}
          <View style={styles.metaSelectors}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.miniChip,
                    selectedCategory === cat && {
                      backgroundColor: CATEGORY_COLORS[cat].bg,
                      borderColor: CATEGORY_COLORS[cat].text,
                    },
                    { borderColor: currentTheme.border },
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.miniChipText,
                      selectedCategory === cat
                        ? { color: CATEGORY_COLORS[cat].text, fontWeight: '700' }
                        : { color: currentTheme.subtext },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}

              <View style={styles.divider} />

              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.miniChip,
                    selectedPriority === p && {
                      backgroundColor: PRIORITY_COLORS[p] + '22',
                      borderColor: PRIORITY_COLORS[p],
                    },
                    { borderColor: currentTheme.border },
                  ]}
                  onPress={() => setSelectedPriority(p)}
                >
                  <View
                    style={[
                      styles.priorityDotSmall,
                      { backgroundColor: PRIORITY_COLORS[p] },
                    ]}
                  />
                  <Text
                    style={[
                      styles.miniChipText,
                      selectedPriority === p
                        ? { color: PRIORITY_COLORS[p], fontWeight: '700' }
                        : { color: currentTheme.subtext },
                    ]}
                  >
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Text Input Row */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: currentTheme.inputBg,
                  color: currentTheme.text,
                },
              ]}
              placeholder="What needs to be done?"
              placeholderTextColor={currentTheme.subtext}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleAddTask}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: currentTheme.accent },
              ]}
              onPress={handleAddTask}
            >
              <Ionicons name="arrow-up" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 14,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  themeToggle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  statusTabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 12,
    gap: 8,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  categoryFilterWrapper: {
    marginVertical: 10,
  },
  categoryFilterContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  catFilterChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  catFilterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  taskCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  taskText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.4,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  priorityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  deleteButton: {
    padding: 6,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
  createSection: {
    borderTopWidth: 1,
    padding: 14,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
  },
  metaSelectors: {
    marginBottom: 10,
  },
  miniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  miniChipText: {
    fontSize: 11,
  },
  divider: {
    width: 1,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 4,
    height: 18,
    alignSelf: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});