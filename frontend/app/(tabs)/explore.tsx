import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/contexts/AuthContext';
import { router } from 'expo-router';

interface Professional {
  id: string;
  full_name: string;
  category: string;
  location: string;
  bio: string;
  avatar_url: string | null;
  average_rating: number | null;
  reviews_count: number;
}

const CATEGORIES = [
  { id: 'all', label: 'Todos', icon: '👥' },
  { id: 'Plomero', label: 'Plomero', icon: '🔧' },
  { id: 'Electricista', label: 'Electricista', icon: '⚡' },
  { id: 'Pintor', label: 'Pintor', icon: '🎨' },
  { id: 'Jardinero', label: 'Jardinero', icon: '🌿' },
  { id: 'Carpintero', label: 'Carpintero', icon: '🪚' },
  { id: 'Limpieza del Hogar', label: 'Limpieza', icon: '🧹' },
  { id: 'Albañil', label: 'Albañil', icon: '🧱' },
  { id: 'Gasista', label: 'Gasista', icon: '🔥' },
];

export default function ExploreScreen() {
  const { user } = useAuth();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('Todas las ciudades');
  const [availableCities, setAvailableCities] = useState<string[]>(['Todas las ciudades']);

  useEffect(() => {
    loadProfessionals();
  }, []);

  useEffect(() => {
    filterProfessionals();
  }, [professionals, searchText, selectedCategory, selectedCity]);

  async function loadProfessionals() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('professionals')
        .select(`
          id,
          user_id,
          display_name,
          profession,
          bio,
          city,
          state,
          rating,
          rating_count,
          avatar_url
        `)
        .eq('is_active', true)
        .order('rating', { ascending: false, nullsFirst: false });

      if (error) throw error;

      console.log('📊 Datos crudos de professionals:', JSON.stringify(data, null, 2));

      // Transformar los datos al formato esperado
      const transformedData = data?.map(prof => {
        const location = [prof.city, prof.state].filter(Boolean).join(', ') || 'Sin ubicación';
        
        console.log(`🖼️ Avatar URL para ${prof.display_name}:`, prof.avatar_url);
        
        return {
          id: prof.id,
          full_name: prof.display_name || 'Sin nombre',
          category: prof.profession || 'Sin categoría',
          location: location,
          bio: prof.bio || '',
          avatar_url: prof.avatar_url || null,
          average_rating: prof.rating || 0,
          reviews_count: prof.rating_count || 0
        };
      }) || [];

      // Extraer ciudades únicas
      const cities = ['Todas las ciudades', ...new Set(data?.map(p => p.city).filter(Boolean) || [])];
      setAvailableCities(cities as string[]);

      setProfessionals(transformedData);
      console.log('✅ Profesionales cargados:', transformedData.length);
    } catch (error: any) {
      console.error('Error loading professionals:', error);
      Alert.alert('Error', 'No se pudieron cargar los profesionales');
    } finally {
      setLoading(false);
    }
  }

  function filterProfessionals() {
    let filtered = professionals;

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => 
        p.category === selectedCategory
      );
    }

    // Filtrar por ciudad
    if (selectedCity !== 'Todas las ciudades') {
      filtered = filtered.filter(p => 
        p.location.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    // Filtrar por búsqueda de texto
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(p =>
        p.full_name.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        p.location.toLowerCase().includes(search) ||
        p.bio.toLowerCase().includes(search)
      );
    }

    setFilteredProfessionals(filtered);
  }

  function handleContactProfessional(professionalId: string) {
    if (!user) {
      Alert.alert('Error', 'Debes iniciar sesión para contactar profesionales');
      return;
    }
    router.push(`/professional/${professionalId}`);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explorar Profesionales</Text>
        <Text style={styles.subtitle}>
          {filteredProfessionals.length} profesionales disponibles
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Búsqueda */}
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, categoría o ubicación..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#999"
          />
        </View>

        {/* Filtro de Categorías */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[
                styles.categoryLabel,
                selectedCategory === cat.id && styles.categoryLabelActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filtro de Ciudades */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.zonesScroll}
          contentContainerStyle={styles.zonesContent}
        >
          {availableCities.map(city => (
            <TouchableOpacity
              key={city}
              style={[
                styles.zoneChip,
                selectedCity === city && styles.zoneChipActive
              ]}
              onPress={() => setSelectedCity(city)}
            >
              <Text style={[
                styles.zoneLabel,
                selectedCity === city && styles.zoneLabelActive
              ]}>
                📍 {city}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Listado de Profesionales */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#1e3a5f" />
            <Text style={styles.loadingText}>Cargando profesionales...</Text>
          </View>
        ) : filteredProfessionals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>😔</Text>
            <Text style={styles.emptyText}>No se encontraron profesionales</Text>
            <Text style={styles.emptySubtext}>
              Intenta cambiar los filtros de búsqueda
            </Text>
          </View>
        ) : (
          <View style={styles.professionalsList}>
            {filteredProfessionals.map(professional => (
              <TouchableOpacity
                key={professional.id}
                style={styles.professionalCard}
                onPress={() => handleContactProfessional(professional.id)}
              >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  {professional.avatar_url ? (
                    <Image 
                      source={{ uri: professional.avatar_url }} 
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarPlaceholderText}>
                        {professional.full_name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Información */}
                <View style={styles.professionalInfo}>
                  <Text style={styles.professionalName}>
                    {professional.full_name}
                  </Text>
                  
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>
                      {professional.category}
                    </Text>
                  </View>

                  <Text style={styles.professionalLocation}>
                    📍 {professional.location}
                  </Text>

                  {professional.bio && (
                    <Text style={styles.professionalBio} numberOfLines={2}>
                      {professional.bio}
                    </Text>
                  )}

                  {/* Rating */}
                  <View style={styles.ratingContainer}>
                    {professional.average_rating && professional.average_rating > 0 ? (
                      <>
                        <Text style={styles.ratingStars}>
                          {'⭐'.repeat(Math.round(professional.average_rating))}
                        </Text>
                        <Text style={styles.ratingText}>
                          {professional.average_rating.toFixed(1)} ({professional.reviews_count} {professional.reviews_count === 1 ? 'reseña' : 'reseñas'})
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.ratingStars}>⭐ Sin calificación</Text>
                    )}
                  </View>
                </View>

                {/* Botón de contacto */}
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={() => handleContactProfessional(professional.id)}
                >
                  <Text style={styles.contactButtonText}>Ver perfil</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#6366f1',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  searchSection: {
    padding: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    backgroundColor: '#f5f7fa',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e6ed',
  },
  categoriesScroll: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f7fa',
    borderWidth: 1,
    borderColor: '#e0e6ed',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 18,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  categoryLabelActive: {
    color: '#fff',
  },
  zonesScroll: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  zonesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  zoneChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f7fa',
    borderWidth: 1,
    borderColor: '#e0e6ed',
    marginRight: 8,
  },
  zoneChipActive: {
    backgroundColor: '#e0e7ff',
    borderColor: '#6366f1',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  zoneLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  zoneLabelActive: {
    color: '#1e3a5f',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 60,
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
    color: '#666',
    textAlign: 'center',
  },
  professionalsList: {
    padding: 16,
    gap: 12,
  },
  professionalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e8f0f8',
  },
  avatarContainer: {
    width: 70,
    height: 70,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  professionalInfo: {
    flex: 1,
    gap: 4,
  },
  professionalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f0ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e3a5f',
  },
  professionalLocation: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  professionalBio: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingStars: {
    fontSize: 12,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  contactButton: {
    alignSelf: 'center',
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  contactButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
