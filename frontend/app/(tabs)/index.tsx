import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { supabase } from '../../src/lib/supabase';

const PROFESSIONS = [
  'All',
  'Carpenter',
  'Electrician',
  'Plumber',
  'Painter',
  'Landscaper',
  'Cleaner',
];

type Professional = {
  id: string;
  display_name: string;
  profession: string;
  city: string;
  state: string;
  rating: number;
  rating_count: number;
  hourly_rate: number;
  years_experience: number;
  profile_image: string | null;
  bio: string;
};

export default function HomeScreen() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchCity, setSearchCity] = useState('');
  const [selectedProfession, setSelectedProfession] = useState('All');

  useEffect(() => {
    fetchProfessionals();
  }, [selectedProfession]);

  async function fetchProfessionals() {
    setLoading(true);
    setError(null);

    let query = supabase.from('professionals').select('*');

    if (selectedProfession !== 'All') {
      query = query.eq('profession', selectedProfession);
    }

    const { data, error } = await query;

    if (error) {
      setError(error.message);
    } else {
      setProfessionals(data || []);
    }
    setLoading(false);
  }

  const filteredProfessionals = professionals.filter((p) =>
    searchCity ? p.city?.toLowerCase().includes(searchCity.toLowerCase()) : true
  );

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={{ color: i <= rating ? '#FFD700' : '#DDD', fontSize: 14 }}>
          ★
        </Text>
      );
    }
    return <View style={{ flexDirection: 'row' }}>{stars}</View>;
  };

  const renderProfessionalCard = ({ item }: { item: Professional }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Image
          source={{
            uri: item.profile_image || 'https://via.placeholder.com/80',
          }}
          style={styles.avatar}
        />
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.display_name}</Text>
          <Text style={styles.profession}>{item.profession}</Text>
          <Text style={styles.location}>📍 {item.city}, {item.state}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          {renderStars(item.rating)}
          <Text style={styles.ratingText}>
            ({item.rating_count} reviews)
          </Text>
        </View>

        <View style={styles.statsRow}>
          {item.hourly_rate > 0 && (
            <View style={styles.stat}>
              <Text style={styles.statValue}>${item.hourly_rate}</Text>
              <Text style={styles.statLabel}>/hour</Text>
            </View>
          )}
          {item.years_experience > 0 && (
            <View style={styles.stat}>
              <Text style={styles.statValue}>{item.years_experience}</Text>
              <Text style={styles.statLabel}>years exp.</Text>
            </View>
          )}
        </View>
      </View>

      {item.bio && (
        <Text style={styles.bio} numberOfLines={2}>
          {item.bio}
        </Text>
      )}

      <TouchableOpacity style={styles.contactButton}>
        <Text style={styles.contactButtonText}>Contact</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Professionals</Text>
        <Text style={styles.subtitle}>Trusted workers near you</Text>
      </View>

      {/* Search by city */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by city..."
          placeholderTextColor="#999"
          value={searchCity}
          onChangeText={setSearchCity}
        />
      </View>

      {/* Profession filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {PROFESSIONS.map((prof) => (
          <TouchableOpacity
            key={prof}
            style={[
              styles.filterChip,
              selectedProfession === prof && styles.filterChipActive,
            ]}
            onPress={() => setSelectedProfession(prof)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedProfession === prof && styles.filterChipTextActive,
              ]}
            >
              {prof}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results count */}
      <Text style={styles.resultsCount}>
        {filteredProfessionals.length} professional{filteredProfessionals.length !== 1 ? 's' : ''} found
      </Text>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#4A90A4" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.error}>Error: {error}</Text>
      ) : (
        <FlatList
          data={filteredProfessionals}
          renderItem={renderProfessionalCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>No professionals found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#4A90A4',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#E0F0F5',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: -20,
  },
  searchInput: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filtersContainer: {
    marginTop: 16,
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#4A90A4',
    borderColor: '#4A90A4',
  },
  filterChipText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  resultsCount: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: '#666',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E0E0E0',
  },
  cardInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  profession: {
    fontSize: 14,
    color: '#4A90A4',
    fontWeight: '500',
    marginTop: 2,
  },
  location: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  cardDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 8,
    color: '#888',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
    marginLeft: 2,
  },
  bio: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
    lineHeight: 20,
  },
  contactButton: {
    backgroundColor: '#4A90A4',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 14,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 40,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 16,
  },
});