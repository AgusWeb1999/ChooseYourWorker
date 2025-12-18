import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';

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
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [premiumUsersMap, setPremiumUsersMap] = useState<Record<string, boolean>>({});
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const professions = [
    'Todos',
    'Carpintero',
    'Electricista',
    'Plomero',
    'Pintor',
    'Jardinero',
    'Limpieza del Hogar',
    'Mantenimiento General',
  ];

  const cities = [
    'Todas',
    'Montevideo',
    'Aguada',
    'maldonado',
    'Canelones',
    'Punta del Este',
    'Salto',
  ];

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    filterProfessionals();
  }, [searchQuery, selectedProfession, selectedCity, professionals, premiumUsersMap]);

  async function fetchProfessionals() {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('id, user_id, display_name, profession, city, state, hourly_rate, rating, rating_count, bio, avatar_url')
        .order('rating', { ascending: false });

      if (!error && data) {
        setProfessionals(data);
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

    // Filtrar por profesión
    if (selectedProfession && selectedProfession !== 'Todos') {
      filtered = filtered.filter((prof) => prof.profession === selectedProfession);
    }

    // Filtrar por ciudad
    if (selectedCity && selectedCity !== 'Todas') {
      filtered = filtered.filter((prof) => 
        prof.city?.toLowerCase() === selectedCity.toLowerCase() ||
        prof.state?.toLowerCase() === selectedCity.toLowerCase()
      );
    }

    // Premium first, then by rating
    filtered.sort((a, b) => {
      const ap = premiumUsersMap[a.user_id] ? 1 : 0;
      const bp = premiumUsersMap[b.user_id] ? 1 : 0;
      if (ap !== bp) return bp - ap; // premium first
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
    return stars;
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
    <View style={styles.container}>
      {/* Nav Bar Superior */}
      <View style={styles.topNav}>
        <Text style={styles.logo}>ChooseYourWorker</Text>
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
        <View style={styles.headerCompact}>
          <Text style={styles.welcomeTextCompact}>👋 Hola, encuentra tu profesional ideal</Text>
          <Text style={styles.subtitleCompact}>Miles de expertos listos para ayudarte</Text>
        </View>

        <View style={styles.filtersGrid}>
          {/* Search Bar */}
          <View style={styles.searchSection}>
            <View style={styles.searchContainerCompact}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInputCompact}
                placeholder="Buscar por nombre, profesión o ciudad..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Categories Section */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Categorías</Text>
            <View style={styles.chipGrid}>
              {professions.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chipButton,
                    selectedProfession === item && styles.chipButtonActive,
                  ]}
                  onPress={() => setSelectedProfession(item === 'Todos' ? null : item)}
                >
                  <Text
                    style={[
                      styles.chipButtonText,
                      selectedProfession === item && styles.chipButtonTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Cities Section */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Ciudades</Text>
            <View style={styles.chipGrid}>
              {cities.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.chipButton,
                    selectedCity === item && styles.chipButtonActive,
                  ]}
                  onPress={() => setSelectedCity(item === 'Todas' ? null : item)}
                >
                  <Text
                    style={[
                      styles.chipButtonText,
                      selectedCity === item && styles.chipButtonTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topNav: {
    width: '100%',
    height: 60,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  headerCompact: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#f8fafc',
  },
  welcomeTextCompact: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitleCompact: {
    fontSize: 14,
    color: '#6b7280',
  },
  filtersGrid: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },
  searchSection: {
    width: '100%',
  },
  searchContainerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 2,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  searchInputCompact: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 12,
    color: '#1f2937',
  },
  filterSection: {
    width: '100%',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 10,
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
    padding: 24,
    paddingTop: 32,
    paddingBottom: 24,
    backgroundColor: '#f8fafc',
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
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
    fontSize: 22,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
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
    padding: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    marginHorizontal: 8,
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
    backgroundColor: '#fffbeb',
    shadowColor: '#fbbf24',
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarText: {
    fontSize: 24,
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
    fontSize: 18,
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
    fontSize: 14,
    color: '#6366f1',
    fontWeight: '600',
    marginBottom: 2,
  },
  location: {
    fontSize: 12,
    color: '#999',
  },
  bio: {
    fontSize: 14,
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
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
});
