import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Entypo from 'react-native-vector-icons/Entypo';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AllColors from '../../../Constants/Color';
import { useTheme } from '../../../Context/ThemeContext';
import { BASE_URL } from '../../../Api/Api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = 92;
const CONTENT_WIDTH = SCREEN_WIDTH - SIDEBAR_WIDTH;

export default function AllCategories() {
  const navigation = useNavigation();
  const { theme, isDarkMode } = useTheme();

  // State
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [subCategoriesMap, setSubCategoriesMap] = useState({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingSubCategories, setIsLoadingSubCategories] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasError, setHasError] = useState(false);

  // Ref to prevent race conditions in subcategory fetching
  const activeCategoryIdRef = useRef(null);

  // Fetch all categories from backend
  const fetchCategories = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (categories.length === 0) {
      setIsLoadingCategories(true);
    }
    setHasError(false);

    try {
      const response = await fetch(`${BASE_URL}categories`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const json = await response.json();

      if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
        setCategories(json.data);

        // Retain or select the first category
        const firstCat = json.data[0];
        setSelectedCategory((prev) => {
          if (prev && json.data.some((c) => c.id === prev.id)) {
            return prev;
          }
          return firstCat;
        });

        const catToFetch = selectedCategory || firstCat;
        if (catToFetch) {
          fetchSubCategories(catToFetch.id);
        }
      } else {
        setCategories([]);
      }
    } catch (err) {
      console.log('Error fetching categories:', err);
      setHasError(true);
    } finally {
      setIsLoadingCategories(false);
      setRefreshing(false);
    }
  }, [categories.length, selectedCategory, fetchSubCategories]);

  // Fetch subcategories for a given category ID
  const fetchSubCategories = useCallback(async (catId) => {
    if (!catId) return;
    activeCategoryIdRef.current = catId;

    // Use cached if already present
    if (subCategoriesMap[catId] !== undefined) {
      return;
    }

    setIsLoadingSubCategories(true);
    try {
      const formData = new FormData();
      formData.append('category_id', String(catId));

      const response = await fetch(`${BASE_URL}sub-category`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });

      const json = await response.json();
      const list =
        json?.data ||
        json?.subcategories ||
        json?.sub_categories ||
        (Array.isArray(json) ? json : []);

      if (activeCategoryIdRef.current === catId) {
        setSubCategoriesMap((prev) => ({
          ...prev,
          [catId]: Array.isArray(list) ? list : [],
        }));
      }
    } catch (err) {
      console.log(`Error fetching sub-categories for cat ${catId}:`, err);
      if (activeCategoryIdRef.current === catId) {
        setSubCategoriesMap((prev) => ({
          ...prev,
          [catId]: [],
        }));
      }
    } finally {
      if (activeCategoryIdRef.current === catId) {
        setIsLoadingSubCategories(false);
      }
    }
  }, [subCategoriesMap]);

  // Initial load
  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle selecting a category from the sidebar
  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    activeCategoryIdRef.current = cat.id;
    if (subCategoriesMap[cat.id] === undefined) {
      fetchSubCategories(cat.id);
    }
  };

  // Navigate to ViewAllProducts for a whole category
  const handleViewAllProductsForCategory = (cat) => {
    if (!cat) return;
    navigation.navigate('ViewAllProducts', {
      title: cat.name,
      categoryId: cat.id,
    });
  };

  // Navigate to ViewAllProducts for a specific subcategory
  const handleSelectSubCategory = (subCat) => {
    if (!subCat) return;
    navigation.navigate('ViewAllProducts', {
      title: subCat.name,
      categoryId: selectedCategory?.id || subCat.category_id,
      subCategoryId: subCat.id,
    });
  };

  // Current active subcategories list
  const currentSubCategories = selectedCategory
    ? subCategoriesMap[selectedCategory.id] || []
    : [];

  // Filtered categories and subcategories when searching
  const filteredCategories = searchQuery.trim()
    ? categories.filter((c) =>
        c.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  // Flattened all subcategories that match the search
  const allKnownSubCategories = Object.values(subCategoriesMap).flat();
  const filteredSubCategories = searchQuery.trim()
    ? allKnownSubCategories.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  const isSearching = searchQuery.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />

      {/* Top Header Bar */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: theme.cardBg,
            borderBottomColor: theme.divider,
          },
        ]}
      >
        <View style={styles.headerLeftRow}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
            All Categories
          </Text>
          {categories.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{categories.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerActionsRow}>
          <TouchableOpacity
            style={[
              styles.actionIconButton,
              { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' },
            ]}
            onPress={() => navigation.navigate('Wishlist')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="heart-outline"
              size={20}
              color={theme.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionIconButton,
              { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' },
            ]}
            onPress={() => navigation.navigate('CartPage')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="cart-outline"
              size={20}
              color={theme.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Bar */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme.cardBg,
            borderBottomColor: theme.divider,
          },
        ]}
      >
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
              borderColor: isDarkMode ? '#334155' : '#E2E8F0',
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={theme.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search categories & subcategories..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Body */}
      {isLoadingCategories ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={AllColors.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading categories...
          </Text>
        </View>
      ) : hasError && categories.length === 0 ? (
        <View style={styles.centerError}>
          <Ionicons
            name="cloud-offline-outline"
            size={48}
            color={AllColors.primary}
          />
          <Text style={[styles.errorTitle, { color: theme.textPrimary }]}>
            Unable to load categories
          </Text>
          <Text style={[styles.errorSub, { color: theme.textSecondary }]}>
            Please check your connection and try again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchCategories(false)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : isSearching ? (
        /* SEARCH RESULTS VIEW */
        <FlatList
          data={filteredCategories}
          keyExtractor={(item) => `search-cat-${item.id}`}
          contentContainerStyle={styles.searchListPadding}
          ListHeaderComponent={() => (
            <View style={styles.searchHeaderBox}>
              <Text
                style={[styles.searchSectionTitle, { color: theme.textPrimary }]}
              >
                Categories ({filteredCategories.length})
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.searchCategoryCard,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: theme.borderColor,
                },
              ]}
              onPress={() => handleViewAllProductsForCategory(item)}
            >
              <View
                style={[
                  styles.searchCatImageWrap,
                  { backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC' },
                ]}
              >
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.searchCatImage}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons
                    name="grid-outline"
                    size={22}
                    color={AllColors.primary}
                  />
                )}
              </View>

              <View style={styles.searchCatInfo}>
                <Text
                  style={[styles.searchCatName, { color: theme.textPrimary }]}
                >
                  {item.name}
                </Text>
                <Text style={styles.searchCatAction}>Explore Products →</Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={18}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
          ListFooterComponent={() =>
            filteredSubCategories.length > 0 ? (
              <View style={styles.searchSubSection}>
                <Text
                  style={[
                    styles.searchSectionTitle,
                    { color: theme.textPrimary, marginTop: 16 },
                  ]}
                >
                  Subcategories ({filteredSubCategories.length})
                </Text>
                <View style={styles.searchSubGrid}>
                  {filteredSubCategories.map((sub) => (
                    <TouchableOpacity
                      key={`sub-${sub.id}`}
                      style={[
                        styles.searchSubChip,
                        {
                          backgroundColor: theme.cardBg,
                          borderColor: theme.borderColor,
                        },
                      ]}
                      onPress={() => handleSelectSubCategory(sub)}
                    >
                      {sub.image && (
                        <Image
                          source={{ uri: sub.image }}
                          style={styles.searchSubChipImage}
                          resizeMode="contain"
                        />
                      )}
                      <Text
                        style={[
                          styles.searchSubChipText,
                          { color: theme.textPrimary },
                        ]}
                        numberOfLines={1}
                      >
                        {sub.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={() => (
            <View style={styles.centerEmpty}>
              <Ionicons
                name="search-outline"
                size={40}
                color={theme.textSecondary}
              />
              <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
                No categories found
              </Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>
                Try searching with a different keyword
              </Text>
            </View>
          )}
        />
      ) : (
        /* DUAL-PANE SPLIT VIEW: SIDEBAR + CONTENT */
        <View style={styles.splitBody}>
          {/* Left Sidebar: Categories List */}
          <View
            style={[
              styles.sidebarContainer,
              {
                backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9',
                borderRightColor: theme.divider,
              },
            ]}
          >
            <FlatList
              data={categories}
              keyExtractor={(item) => `cat-${item.id}`}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sidebarListPadding}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => fetchCategories(true)}
                  colors={[AllColors.primary]}
                />
              }
              renderItem={({ item }) => {
                const isSelected = selectedCategory?.id === item.id;
                return (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleSelectCategory(item)}
                    style={[
                      styles.sidebarItem,
                      isSelected && {
                        backgroundColor: theme.cardBg,
                      },
                    ]}
                  >
                    {/* Active Left Indicator Bar */}
                    {isSelected && <View style={styles.activeIndicator} />}

                    {/* Category Thumbnail */}
                    <View
                      style={[
                        styles.sidebarThumbBox,
                        {
                          backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                          borderColor: isSelected
                            ? AllColors.primary
                            : isDarkMode
                            ? '#334155'
                            : '#E2E8F0',
                        },
                        isSelected && styles.sidebarThumbBoxActive,
                      ]}
                    >
                      {item.image ? (
                        <Image
                          source={{ uri: item.image }}
                          style={styles.sidebarThumbImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Ionicons
                          name="grid-outline"
                          size={20}
                          color={
                            isSelected ? AllColors.primary : theme.textSecondary
                          }
                        />
                      )}
                    </View>

                    {/* Category Name */}
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.sidebarItemText,
                        { color: theme.textSecondary },
                        isSelected && [
                          styles.sidebarItemTextActive,
                          { color: AllColors.primary },
                        ],
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Right Main Panel: Selected Category & Subcategories */}
          <View
            style={[
              styles.mainContentContainer,
              { backgroundColor: theme.cardBg },
            ]}
          >
            {selectedCategory ? (
              <FlatList
                data={currentSubCategories}
                keyExtractor={(item) => `subcat-${item.id}`}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.subCatListPadding}
                columnWrapperStyle={
                  currentSubCategories.length > 0
                    ? styles.subCatColumnWrapper
                    : null
                }
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                      fetchCategories(true);
                      if (selectedCategory) {
                        fetchSubCategories(selectedCategory.id);
                      }
                    }}
                    colors={[AllColors.primary]}
                  />
                }
                ListHeaderComponent={() => (
                  <View style={styles.rightPanelHeader}>
                    {/* Category Banner Card */}
                    <View
                      style={[
                        styles.categoryHeroBanner,
                        {
                          backgroundColor: isDarkMode
                            ? 'rgba(247, 22, 112, 0.12)'
                            : AllColors.softPinkBg,
                          borderColor: isDarkMode
                            ? 'rgba(247, 22, 112, 0.3)'
                            : '#FBCFE8',
                        },
                      ]}
                    >
                      <View style={styles.heroTextCol}>
                        <Text
                          style={[
                            styles.heroTitle,
                            { color: theme.textPrimary },
                          ]}
                          numberOfLines={2}
                        >
                          {selectedCategory.name}
                        </Text>
                        <Text
                          style={[
                            styles.heroSub,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {currentSubCategories.length > 0
                            ? `${currentSubCategories.length} Subcategories`
                            : 'Explore collection'}
                        </Text>

                        <TouchableOpacity
                          style={styles.heroBrowseButton}
                          onPress={() =>
                            handleViewAllProductsForCategory(selectedCategory)
                          }
                          activeOpacity={0.8}
                        >
                          <Text style={styles.heroBrowseBtnText}>
                            View All Products
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={14}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>
                      </View>

                      {selectedCategory.image && (
                        <Image
                          source={{ uri: selectedCategory.image }}
                          style={styles.heroImage}
                          resizeMode="contain"
                        />
                      )}
                    </View>

                    {/* Section Title */}
                    <View style={styles.subSectionTitleRow}>
                      <Text
                        style={[
                          styles.subSectionTitle,
                          { color: theme.textPrimary },
                        ]}
                      >
                        Subcategories
                      </Text>
                      {currentSubCategories.length > 0 && (
                        <Text
                          style={[
                            styles.subSectionCount,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {currentSubCategories.length} items
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.subCategoryCard,
                      {
                        backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                        borderColor: isDarkMode ? '#334155' : '#E2E8F0',
                      },
                    ]}
                    onPress={() => handleSelectSubCategory(item)}
                  >
                    <View
                      style={[
                        styles.subCatImageWrapper,
                        {
                          backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
                        },
                      ]}
                    >
                      {item.image ? (
                        <Image
                          source={{ uri: item.image }}
                          style={styles.subCatImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Ionicons
                          name="pricetag-outline"
                          size={24}
                          color={AllColors.primary}
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.subCatNameText,
                        { color: theme.textPrimary },
                      ]}
                      numberOfLines={2}
                    >
                      {item.name}
                    </Text>

                    {item.count_child_category > 0 && (
                      <View style={styles.subCatBadgeChip}>
                        <Text style={styles.subCatBadgeText}>
                          {item.count_child_category} types
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={() =>
                  isLoadingSubCategories ? (
                    <View style={styles.subLoadingBox}>
                      <ActivityIndicator
                        size="small"
                        color={AllColors.primary}
                      />
                      <Text
                        style={[
                          styles.subLoadingText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Loading subcategories...
                      </Text>
                    </View>
                  ) : (
                    /* Category without subcategories: Show direct explore CTA */
                    <View style={styles.emptySubContainer}>
                      <View
                        style={[
                          styles.emptySubIconCircle,
                          {
                            backgroundColor: isDarkMode
                              ? '#1E293B'
                              : '#F1F5F9',
                          },
                        ]}
                      >
                        <Ionicons
                          name="bag-handle-outline"
                          size={38}
                          color={AllColors.primary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.emptySubTitle,
                          { color: theme.textPrimary },
                        ]}
                      >
                        Explore {selectedCategory.name}
                      </Text>
                      <Text
                        style={[
                          styles.emptySubDesc,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Browse all top-quality products available in this
                        category.
                      </Text>

                      <TouchableOpacity
                        style={styles.exploreAllBtn}
                        onPress={() =>
                          handleViewAllProductsForCategory(selectedCategory)
                        }
                      >
                        <Text style={styles.exploreAllBtnText}>
                          Browse Products →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )
                }
              />
            ) : (
              <View style={styles.centerLoading}>
                <ActivityIndicator size="small" color={AllColors.primary} />
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: AllColors.softPinkBg,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(247, 22, 112, 0.3)',
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: AllColors.primary,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 0,
  },
  splitBody: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebarContainer: {
    width: SIDEBAR_WIDTH,
    borderRightWidth: 1,
  },
  sidebarListPadding: {
    paddingBottom: 30,
  },
  sidebarItem: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    backgroundColor: AllColors.primary,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  sidebarThumbBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 6,
  },
  sidebarThumbBoxActive: {
    borderColor: AllColors.primary,
    backgroundColor: AllColors.softPinkBg,
    elevation: 2,
    shadowColor: AllColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  sidebarThumbImage: {
    width: 34,
    height: 34,
  },
  sidebarItemText: {
    fontSize: 10.5,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 4,
    lineHeight: 14,
  },
  sidebarItemTextActive: {
    fontWeight: '700',
  },
  mainContentContainer: {
    flex: 1,
  },
  subCatListPadding: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 40,
  },
  subCatColumnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  rightPanelHeader: {
    marginBottom: 14,
  },
  categoryHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  heroSub: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 8,
  },
  heroBrowseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: AllColors.primary,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  heroBrowseBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  heroImage: {
    width: 60,
    height: 60,
  },
  subSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  subSectionCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  subCategoryCard: {
    width: (CONTENT_WIDTH - 32) / 2,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  subCatImageWrapper: {
    width: '100%',
    aspectRatio: 1.1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  subCatImage: {
    width: '80%',
    height: '80%',
  },
  subCatNameText: {
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15,
  },
  subCatBadgeChip: {
    marginTop: 5,
    backgroundColor: AllColors.softPinkBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  subCatBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: AllColors.primary,
  },
  subLoadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  subLoadingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptySubContainer: {
    paddingVertical: 36,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptySubIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptySubTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  exploreAllBtn: {
    backgroundColor: AllColors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
  },
  exploreAllBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  centerError: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    gap: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  errorSub: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: AllColors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 18,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchListPadding: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  searchHeaderBox: {
    marginBottom: 10,
  },
  searchSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  searchCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchCatImageWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchCatImage: {
    width: 36,
    height: 36,
  },
  searchCatInfo: {
    flex: 1,
  },
  searchCatName: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchCatAction: {
    fontSize: 11,
    fontWeight: '600',
    color: AllColors.primary,
    marginTop: 2,
  },
  searchSubSection: {
    marginTop: 8,
  },
  searchSubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  searchSubChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  searchSubChipImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  searchSubChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  centerEmpty: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
  },
});