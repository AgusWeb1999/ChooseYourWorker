import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';

interface Professional {
  id: string;
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
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfession, setSelectedProfession] = useState<string | null>(null);

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

  useEffect(() => {
    fetchProfessionals();
  }, []);

  useEffect(() => {
    filterProfessionals();
  }, [searchQuery, selectedProfession, professionals]);

  async function fetchProfessionals() {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('*')
        .order('rating', { ascending: false });

      if (!error && data) {
        setProfessionals(data);
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
    return (
      <TouchableOpacity
        style={styles.card}
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
            <Text style={styles.name}>{item.display_name}</Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>Buscar Profesionales</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, profesión o ciudad..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={professions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedProfession === item && styles.filterChipActive,
              ]}
              onPress={() => setSelectedProfession(item === 'Todos' ? null : item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedProfession === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1e3a5f',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
  },
  filterContainer: {
    paddingVertical: 12,
    paddingLeft: 20,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterChipActive: {
    backgroundColor: '#1e3a5f',
    borderColor: '#1e3a5f',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1e3a5f',
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
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profession: {
    fontSize: 14,
    color: '#1e3a5f',
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
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
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
