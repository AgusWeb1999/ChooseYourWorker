import { useState, useEffect } from 'react';
import OnboardingModal from '../../components/OnboardingModal';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Image, Platform, SafeAreaView, ScrollView, Modal, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { useWindowDimensions } from '../../hooks/useWindowDimensions';

interface Professional {
  id: string;
  user_id: string;
  display_name: string;
  profession: string;
  city: string;
  state: string;
  hourly_rate: number;
  rating: number;
  rating_count: number;
  bio: string;
  avatar_url: string | null;
}

export default function HomeScreen() {
  const { user, userProfile } = useAuth();
  const { width } = useWindowDimensions();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [premiumUsersMap, setPremiumUsersMap] = useState<Record<string, boolean>>({});
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedMinRating, setSelectedMinRating] = useState<number>(0);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  
  // Filtros dinámicos desde la BD
  const [professions, setProfessions] = useState<string[]>(['Todos']);
  const [cities, setCities] = useState<string[]>(['Todas']);

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    filterProfessionals();
  }, [searchQuery, selectedProfession, selectedCity, selectedMinRating, professionals, premiumUsersMap]);

  async function fetchProfessionals() {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, user_id, display_name, profession, city, state, hourly_rate, rating, rating_count, bio, avatar_url')
        .order('rating', { ascending: false });

      if (!error && data) {
        setProfessionals(data);
        
        // Extraer profesiones únicas y normalizadas (capitalizar primera letra)
        const professionSet = new Set<string>();
        data.forEach(p => {
          if (p.profession) {
            // Limpiar espacios y normalizar
            const cleaned = p.profession.trim();
            const normalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
            professionSet.add(normalized);
          }
        });
        setProfessions(['Todos', ...Array.from(professionSet).sort()]);
        
        // Extraer ciudades únicas y normalizadas (capitalizar primera letra)
        const citySet = new Set<string>();
        data.forEach(p => {
          if (p.city) {
            // Limpiar espacios y normalizar
            const cleaned = p.city.trim();
            const normalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
            citySet.add(normalized);
          }
        });
        setCities(['Todas', ...Array.from(citySet).sort()]);
        
        // Fetch premium flags for user_ids
        const userIds = data.map(p => p.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, subscription_type, subscription_status, subscription_end_date')
            .in('id', userIds);
          const now = new Date();
          const map: Record<string, boolean> = {};
          (usersData || []).forEach(u => {
            const active = u.subscription_type === 'premium' && u.subscription_status === 'active' && u.subscription_end_date && new Date(u.subscription_end_date) > now;
            map[u.id] = !!active;
          });
          setPremiumUsersMap(map);
        }
      }
    } catch (error) {
      console.error('Error fetching professionals:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterProfessionals() {
    let filtered = [...professionals];

    // Filtrar por búsqueda
    if (searchQuery) {
      filtered = filtered.filter(
        (prof) =>
          prof.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prof.profession?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prof.city?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrar por profesión (normalizar comparación)
    if (selectedProfession && selectedProfession !== 'Todos') {
      filtered = filtered.filter((prof) => {
        const profNormalized = prof.profession?.trim().charAt(0).toUpperCase() + prof.profession?.trim().slice(1).toLowerCase();
        return profNormalized === selectedProfession;
      });
    }

    // Filtrar por ciudad (normalizar comparación)
    if (selectedCity && selectedCity !== 'Todas') {
      filtered = filtered.filter((prof) => {
        const cityNormalized = prof.city?.trim().charAt(0).toUpperCase() + prof.city?.trim().slice(1).toLowerCase();
        return cityNormalized === selectedCity;
      });
    }

    // Filtrar por rating mínimo
    if (selectedMinRating > 0) {
      filtered = filtered.filter((prof) => (prof.rating || 0) >= selectedMinRating);
    }

    // ORDENAMIENTO: Premium primero, luego por rating
    filtered.sort((a, b) => {
      const isPremiumA = premiumUsersMap[a.user_id] ? 1 : 0;
      const isPremiumB = premiumUsersMap[b.user_id] ? 1 : 0;
      
      // Si uno es premium y el otro no, el premium va primero
      if (isPremiumA !== isPremiumB) {
        return isPremiumB - isPremiumA;
      }
      
      // Si ambos tienen el mismo estado premium, ordenar por rating
      return (b.rating || 0) - (a.rating || 0);
    });
    
    setFilteredProfessionals(filtered);
  }

  function renderStars(rating: number) {
    const stars = [];
    const roundedRating = Math.round(rating);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= roundedRating ? '⭐' : '☆'}
        </Text>
      );
    }
    return <>{stars}</>;
  }

  function renderProfessionalCard({ item }: { item: Professional }) {
    const isPremium = premiumUsersMap[item.user_id];
    return (
      <TouchableOpacity
        style={[styles.card, isPremium && styles.premiumCard]}
        onPress={() => router.push(`/professional/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            {item.avatar_url ? (
              <Image 
                source={{ uri: item.avatar_url }} 
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {item.display_name?.charAt(0)?.toUpperCase() || '?'}
              </Text>
            )}
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{item.display_name}</Text>
              {isPremium && (
                <View style={styles.premiumPill}>
                  <Text style={styles.premiumPillText}>Premium</Text>
                </View>
              )}
            </View>
            <Text style={styles.profession}>{item.profession}</Text>
            <Text style={styles.location}>
              📍 {item.city}, {item.state}
            </Text>
          </View>
        </View>

        {item.bio && (
          <Text style={styles.bio} numberOfLines={2}>
            {item.bio}
          </Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.rating}>
            <View style={styles.starsRow}>
              {renderStars(item.rating || 0)}
            </View>
            <Text style={styles.ratingText}>
              {(item.rating && item.rating > 0) ? item.rating.toFixed(1) : 'Sin calificaciones'}
            </Text>
            {item.rating_count > 0 && (
              <Text style={styles.reviewCount}>({item.rating_count})</Text>
            )}
          </View>
          {item.hourly_rate && (
            <View style={styles.rateContainer}>
              <Text style={styles.rate}>${item.hourly_rate}/hr</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a5f" />
        <Text style={styles.loadingText}>Cargando profesionales...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Nav Bar Superior */}
        <View style={styles.topNav}>
          <Text style={styles.logo}>WorkingGo</Text>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile' as any)}
          >
            {userProfile?.avatar_url ? (
              <Image source={{ uri: userProfile.avatar_url }} style={styles.navAvatar} />
            ) : (
              <View style={styles.navAvatarPlaceholder}>
                <Text style={styles.navAvatarText}>
                  {userProfile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.contentLimiter}>
          {/* Header y Search para mobile nativo y web mobile */}
          {(Platform.OS !== 'web' || width < 768) && (
            <>
              <View style={styles.headerCompact}>
                <Text style={styles.welcomeTextCompact}>Para tu proximo trabajo encuentra un profesional!</Text>
              </View>

              {/* Search Bar */}
              <View style={styles.searchSection}>
                <View style={styles.searchContainerCompact}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.searchInputCompact}
                    placeholder="Buscar por nombre, profesion o ciudad..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
              </View>

              {/* Filtro de Rating en Mobile */}
              <View style={styles.mobileRatingSection}>
                <Text style={styles.mobileFilterLabel}>Clasificación:</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.mobileRatingScroll}
                >
                  {[0, 3, 4, 5].map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      style={[
                        styles.mobileRatingChip,
                        selectedMinRating === rating && styles.mobileRatingChipActive,
                      ]}
                      onPress={() => setSelectedMinRating(rating)}
                    >
                      {rating === 0 ? (
                        <Text style={[
                          styles.mobileRatingChipText,
                          selectedMinRating === rating && styles.mobileRatingChipTextActive,
                        ]}>
                          Todas ⭐
                        </Text>
                      ) : (
                        <View style={styles.ratingChipContent}>
                          <Text style={[
                            styles.mobileRatingChipText,
                            selectedMinRating === rating && styles.mobileRatingChipTextActive,
                          ]}>
                            {rating}+
                          </Text>
                          <Text style={styles.starIcon}>⭐</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          )}

          {/* Layout Web con Sidebar - Solo desktop (>768px) */}
          {Platform.OS === 'web' && width >= 768 ? (
            <View style={styles.webLayoutContainer}>
              {/* Sidebar de filtros */}
              <ScrollView 
                style={styles.sidebarFilters}
                contentContainerStyle={styles.sidebarContent}
                showsVerticalScrollIndicator={true}
              >
                <View style={styles.sidebarHeader}>
                  <Text style={styles.sidebarTitle}>Filtros</Text>
                  <TouchableOpacity onPress={() => { 
                    setSelectedProfession(null); 
                    setSelectedCity(null); 
                    setSelectedMinRating(0);
                  }}>
                    <Text style={styles.clearText}>Limpiar</Text>
                  </TouchableOpacity>
                </View>

                {/* Search Bar en sidebar */}
                <View style={styles.sidebarSearchContainer}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    style={styles.sidebarSearchInput}
                    placeholder="Buscar..."
                    placeholderTextColor="#9ca3af"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                {/* Categorías */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Categorías</Text>
                  <View style={styles.verticalChipList}>
                    {professions.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.sidebarChip,
                          selectedProfession === item && styles.sidebarChipActive,
                        ]}
                        onPress={() => setSelectedProfession(item === 'Todos' ? null : item)}
                      >
                        <Text
                          style={[
                            styles.sidebarChipText,
                            selectedProfession === item && styles.sidebarChipTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.sidebarDivider} />

                {/* Ciudades */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Ciudades</Text>
                  <View style={styles.verticalChipList}>
                    {cities.map((item) => (
                      <TouchableOpacity
                        key={item}
                        style={[
                          styles.sidebarChip,
                          selectedCity === item && styles.sidebarChipActive,
                        ]}
                        onPress={() => setSelectedCity(item === 'Todas' ? null : item)}
                      >
                        <Text
                          style={[
                            styles.sidebarChipText,
                            selectedCity === item && styles.sidebarChipTextActive,
                          ]}
                        >
                          {item}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.sidebarDivider} />

                {/* Clasificación */}
                <View style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>Clasificación Mínima</Text>
                  <View style={styles.ratingFilterContainer}>
                    {[0, 3, 4, 5].map((rating) => (
                      <TouchableOpacity
                        key={rating}
                        style={[
                          styles.ratingChip,
                          selectedMinRating === rating && styles.ratingChipActive,
                        ]}
                        onPress={() => setSelectedMinRating(rating)}
                      >
                        {rating === 0 ? (
                          <Text style={[
                            styles.ratingChipText,
                            selectedMinRating === rating && styles.ratingChipTextActive,
                          ]}>
                            Todas ⭐
                          </Text>
                        ) : (
                          <View style={styles.ratingChipContent}>
                            <Text style={[
                              styles.ratingChipText,
                              selectedMinRating === rating && styles.ratingChipTextActive,
                            ]}>
                              {rating}+
                            </Text>
                            <Text style={styles.starIcon}>⭐</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              {/* Contenido principal */}
              <View style={styles.mainContent}>
                <View style={styles.webHeaderCompact}>
                  <Text style={styles.webWelcomeText}>Encuentra tu profesional ideal</Text>
                  <Text style={styles.webSubtitle}>Miles de expertos listos para ayudarte</Text>
                </View>

                {filteredProfessionals.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyText}>No se encontraron profesionales</Text>
                    <Text style={styles.emptySubtext}>
                      Intenta con otros términos de búsqueda
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredProfessionals}
                    keyExtractor={(item) => item.id}
                    renderItem={renderProfessionalCard}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                  />
                )}
              </View>
            </View>
          ) : (
            // Mobile view (nativo y web mobile < 768px)
            <>
              {/* Filters for Mobile - Dropdowns */}
              <View style={styles.mobileFiltersCompact}>
                <TouchableOpacity 
                  style={styles.filterButton}
                  onPress={() => setCategoryModalVisible(true)}
                >
                  <Text style={styles.filterButtonText}>
                    {selectedProfession || 'Categoría'}
                  </Text>
                  <Text style={styles.filterArrow}>▼</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.filterButton}
                  onPress={() => setCityModalVisible(true)}
                >
                  <Text style={styles.filterButtonText}>
                    {selectedCity || 'Ciudad'}
                  </Text>
                  <Text style={styles.filterArrow}>▼</Text>
                </TouchableOpacity>
              </View>

              {filteredProfessionals.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyText}>No se encontraron profesionales</Text>
                  <Text style={styles.emptySubtext}>
                    Intenta con otros términos de búsqueda
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredProfessionals}
                  keyExtractor={(item) => item.id}
                  renderItem={renderProfessionalCard}
                  contentContainerStyle={styles.list}
                  showsVerticalScrollIndicator={false}
                />
              )}
            </>
          )}

          {/* Category Modal */}
          <Modal
            visible={categoryModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setCategoryModalVisible(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setCategoryModalVisible(false)}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Selecciona una categoría</Text>
                <ScrollView style={styles.modalScroll}>
                  {professions.map((prof) => (
                    <TouchableOpacity
                      key={prof}
                      style={[
                        styles.modalOption,
                        (selectedProfession === prof || (prof === 'Todos' && !selectedProfession)) && styles.modalOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedProfession(prof === 'Todos' ? null : prof);
                        setCategoryModalVisible(false);
                      }}
                    >
                      <Text style={[
                        styles.modalOptionText,
                        (selectedProfession === prof || (prof === 'Todos' && !selectedProfession)) && styles.modalOptionTextSelected
                      ]}>
                        {prof}
                      </Text>
                      {(selectedProfession === prof || (prof === 'Todos' && !selectedProfession)) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* City Modal */}
          <Modal
            visible={cityModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setCityModalVisible(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setCityModalVisible(false)}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Selecciona una ciudad</Text>
                <ScrollView style={styles.modalScroll}>
                  {cities.map((city) => (
                    <TouchableOpacity
                      key={city}
                      style={[
                        styles.modalOption,
                        (selectedCity === city || (city === 'Todas' && !selectedCity)) && styles.modalOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedCity(city === 'Todas' ? null : city);
                        setCityModalVisible(false);
                      }}
                    >
                      <Text style={[
                        styles.modalOptionText,
                        (selectedCity === city || (city === 'Todas' && !selectedCity)) && styles.modalOptionTextSelected
                      ]}>
                        {city}
                      </Text>
                      {(selectedCity === city || (city === 'Todas' && !selectedCity)) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </View>
    </SafeAreaView>
  );
}

interface Styles {
    ratingFilterContainer: ViewStyle;
    ratingChip: ViewStyle;
    ratingChipActive: ViewStyle;
    ratingChipContent: ViewStyle;
    ratingChipText: TextStyle;
    ratingChipTextActive: TextStyle;
    starIcon: TextStyle;
  safeArea: ViewStyle;
  container: ViewStyle;
  topNav: ViewStyle;
  logo: TextStyle;
  profileButton: ViewStyle;
  navAvatar: ImageStyle;
  navAvatarPlaceholder: ViewStyle;
  navAvatarText: TextStyle;
  contentLimiter: ViewStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  headerCompact: ViewStyle;
  webLayoutContainer: ViewStyle;
  sidebarFilters: ViewStyle;
  sidebarContent: ViewStyle;
  sidebarHeader: ViewStyle;
  sidebarTitle: TextStyle;
  sidebarSearchContainer: ViewStyle;
  sidebarSearchInput: TextStyle;
  filterGroup: ViewStyle;
  filterGroupTitle: TextStyle;
  verticalChipList: ViewStyle;
  sidebarChip: ViewStyle;
  sidebarChipActive: ViewStyle;
  sidebarChipText: TextStyle;
  sidebarChipTextActive: TextStyle;
  sidebarDivider: ViewStyle;
  mainContent: ViewStyle;
  webHeaderCompact: ViewStyle;
  webWelcomeText: TextStyle;
  webSubtitle: TextStyle;
  welcomeTextCompact: TextStyle;
  subtitleCompact: TextStyle;
  searchSection: ViewStyle;
  searchContainerCompact: ViewStyle;
  searchIcon: TextStyle;
  searchInputCompact: TextStyle;
  webFiltersShell: ViewStyle;
  webFiltersCard: ViewStyle;
  webFiltersHeader: ViewStyle;
  webFiltersTitle: TextStyle;
  clearText: TextStyle;
  webFiltersColumns: ViewStyle;
  webColumn: ViewStyle;
  filterSectionTitle: TextStyle;
  webDivider: ViewStyle;
  chipGridCompact: ViewStyle;
  chipButtonCompact: ViewStyle;
  chipButtonCompactActive: ViewStyle;
  chipButtonTextCompact: TextStyle;
  chipButtonTextCompactActive: TextStyle;
  chipGrid: ViewStyle;
  chipButton: ViewStyle;
  chipButtonActive: ViewStyle;
  chipButtonText: TextStyle;
  chipButtonTextActive: TextStyle;
  header: ViewStyle;
  welcomeText: TextStyle;
  subtitle: TextStyle;
  searchContainer: ViewStyle;
  searchIconLarge: TextStyle;
  searchInput: TextStyle;
  filterContainer: ViewStyle;
  filterTitle: TextStyle;
  filterChip: ViewStyle;
  filterChipActive: ViewStyle;
  filterChipText: TextStyle;
  filterChipTextActive: TextStyle;
  list: ViewStyle;
  card: ViewStyle;
  premiumCard: ViewStyle;
  cardHeader: ViewStyle;
  avatar: ViewStyle;
  avatarImage: ImageStyle;
  avatarText: TextStyle;
  cardInfo: ViewStyle;
  nameRow: ViewStyle;
  name: TextStyle;
  premiumPill: ViewStyle;
  premiumPillText: TextStyle;
  profession: TextStyle;
  location: TextStyle;
  bio: TextStyle;
  cardFooter: ViewStyle;
  rating: ViewStyle;
  starsRow: ViewStyle;
  star: TextStyle;
  ratingText: TextStyle;
  reviewCount: TextStyle;
  rateContainer: ViewStyle;
  rate: TextStyle;
  emptyContainer: ViewStyle;
  emptyIcon: TextStyle;
  emptyText: TextStyle;
  emptySubtext: TextStyle;
  mobileFiltersCompact: ViewStyle;
  mobileRatingSection: ViewStyle;
  mobileFilterLabel: TextStyle;
  mobileRatingScroll: ViewStyle;
  mobileRatingChip: ViewStyle;
  mobileRatingChipActive: ViewStyle;
  mobileRatingChipText: TextStyle;
  mobileRatingChipTextActive: TextStyle;
  filterButton: ViewStyle;
  filterButtonText: TextStyle;
  filterArrow: TextStyle;
  modalOverlay: ViewStyle;
  modalContent: ViewStyle;
  modalTitle: TextStyle;
  modalScroll: ViewStyle;
  modalOption: ViewStyle;
  modalOptionSelected: ViewStyle;
  modalOptionText: TextStyle;
  modalOptionTextSelected: TextStyle;
  checkmark: TextStyle;
  titleContainer: ViewStyle;
}

const isWeb = typeof window !== 'undefined' && Platform.OS === 'web';
const styles = StyleSheet.create<Styles>({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: isWeb ? 40 : 20,
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  headerCompact: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginTop: 0,
    alignSelf: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
    ratingChipContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    starIcon: {
      fontSize: 14,
    },
    ratingFilterContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    ratingChip: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: '#f8fafc',
      borderWidth: 1.5,
      borderColor: '#e2e8f0',
      minWidth: 70,
      alignItems: 'center',
    },
    ratingChipActive: {
      backgroundColor: '#fef3c7',
      borderColor: '#f59e0b',
    },
    ratingChipText: {
      fontSize: 13,
      color: '#475569',
      fontWeight: '600',
    },
    ratingChipTextActive: {
      color: '#d97706',
      fontWeight: '700',
    },
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topNav: {
    width: '100%',
    height: Platform.OS === 'web' ? 60 : 56,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  logo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  profileButton: {
    padding: 4,
  },
  navAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  navAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  contentLimiter: {
    flex: 1,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: Platform.OS === 'web' ? 0 : 0,
  },
  webLayoutContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sidebarFilters: {
    flex: 1,
    maxWidth: '33%',
    minWidth: 140,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: '100%',
  },
  mainContent: {
    flex: 2,
    minWidth: 0,
  },
  sidebarContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  sidebarSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 20,
  },
  sidebarSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 2,
  },
  filterGroup: {
    marginBottom: 20,
  },
  filterGroupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  verticalChipList: {
    gap: 6,
  },
  sidebarChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sidebarChipActive: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
  },
  sidebarChipText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  sidebarChipTextActive: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 20,
  },
  webHeaderCompact: {
    marginBottom: 20,
  },
  webWelcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  webSubtitle: {
    fontSize: 16,
    color: '#475569'
  },
  welcomeTextCompact: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitleCompact: {
    fontSize: 14,
    color: '#475569',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  searchContainerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: isWeb ? 10 : 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    color: '#475569',
    marginRight: 10,
  },
  searchInputCompact: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingTop: Platform.OS === 'web' ? 8 : 4,
    paddingVertical: Platform.OS === 'web' ? 8 : 4,
  },
  webFiltersShell: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  webFiltersCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  webFiltersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  webFiltersTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  clearText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  webFiltersColumns: {
    flexDirection: 'row',
    gap: 16,
  },
  webColumn: {
    flex: 1,
    gap: 10,
  },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  webDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  chipGridCompact: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipButtonCompact: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipButtonCompactActive: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
  },
  chipButtonTextCompact: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
  },
  chipButtonTextCompactActive: {
    color: '#4f46e5',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  chipButtonActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  chipButtonText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  chipButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    padding: Platform.OS === 'web' ? 24 : 16,
    paddingTop: Platform.OS === 'web' ? 32 : 16,
    paddingBottom: Platform.OS === 'web' ? 24 : 16,
    backgroundColor: '#f8fafc',
  },
  welcomeText: {
    fontSize: Platform.OS === 'web' ? 26 : 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? 16 : 14,
    color: '#6b7280',
    marginBottom: Platform.OS === 'web' ? 24 : 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: Platform.OS === 'web' ? 16 : 12,
    paddingVertical: 4,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: '#e0e7ff',
  },
  searchIconLarge: {
    fontSize: Platform.OS === 'web' ? 22 : 18,
    marginRight: Platform.OS === 'web' ? 12 : 8,
  },
  searchInput: {
    flex: 1,
    fontSize: Platform.OS === 'web' ? 16 : 14,
    paddingVertical: Platform.OS === 'web' ? 14 : 10,
    color: '#1f2937',
  },
  filterContainer: {
    paddingVertical: 16,
    paddingLeft: 20,
    backgroundColor: '#f8fafc',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    paddingLeft: 4,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#fff',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  filterChipText: {
    fontSize: 15,
    color: '#4b5563',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: Platform.OS === 'web' ? 16 : 8,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: Platform.OS === 'web' ? 18 : 14,
    marginBottom: 14,
    marginHorizontal: Platform.OS === 'web' ? 8 : 4,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  premiumCard: {
    borderColor: '#fbbf24',
    borderWidth: 2,
    backgroundColor: '#fffbeb',
    shadowColor: '#fbbf24',
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: Platform.OS === 'web' ? 60 : 52,
    height: Platform.OS === 'web' ? 60 : 52,
    borderRadius: Platform.OS === 'web' ? 30 : 26,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: Platform.OS === 'web' ? 60 : 52,
    height: Platform.OS === 'web' ? 60 : 52,
    borderRadius: Platform.OS === 'web' ? 30 : 26,
  },
  avatarText: {
    fontSize: Platform.OS === 'web' ? 24 : 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: Platform.OS === 'web' ? 18 : 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  premiumPill: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  premiumPillText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  profession: {
    fontSize: Platform.OS === 'web' ? 14 : 13,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 2,
  },
  location: {
    fontSize: Platform.OS === 'web' ? 12 : 11,
    color: '#999',
  },
  bio: {
    fontSize: Platform.OS === 'web' ? 14 : 13,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    marginRight: 4,
  },
  star: {
    fontSize: 16,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#999',
    marginLeft: 2,
  },
  rateContainer: {
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a5f',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  mobileFiltersCompact: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  mobileRatingSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  mobileFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  mobileRatingScroll: {
    gap: 8,
    paddingRight: 16,
  },
  mobileRatingChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    minWidth: 75,
    alignItems: 'center',
  },
  mobileRatingChipActive: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  mobileRatingChipText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  mobileRatingChipTextActive: {
    color: '#d97706',
    fontWeight: '700',
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 4,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  filterArrow: {
    fontSize: 10,
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  modalOptionSelected: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#6366f1',
    fontWeight: 'bold',
    position: 'absolute',
    right: 10,
  },
});
