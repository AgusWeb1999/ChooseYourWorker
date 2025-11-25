import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../src/lib/supabase';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  client: {
    full_name: string;
  };
}

interface ReviewsListProps {
  professionalId: string;
}

export default function ReviewsList({ professionalId }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    fetchReviews();
    fetchProfessionalRating();
  }, [professionalId]);

  async function fetchReviews() {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          client:users!reviews_client_id_fkey (
            full_name
          )
        `)
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // @ts-ignore - Supabase typing issue with nested selects
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProfessionalRating() {
    try {
      const { data, error } = await supabase
        .from('professionals')
        .select('rating, rating_count')
        .eq('id', professionalId)
        .single();

      if (!error && data) {
        setAverageRating(data.rating || 0);
        setTotalReviews(data.rating_count || 0);
      }
    } catch (error) {
      console.error('Error fetching rating:', error);
    }
  }

  function renderStars(rating: number) {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= rating ? '⭐' : '☆'}
        </Text>
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a5f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Resumen de calificaciones */}
      <View style={styles.summaryContainer}>
        <View style={styles.ratingBox}>
          <Text style={styles.averageNumber}>{averageRating.toFixed(1)}</Text>
          {renderStars(Math.round(averageRating))}
          <Text style={styles.totalReviews}>
            {totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'}
          </Text>
        </View>
      </View>

      {/* Lista de reseñas */}
      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💭</Text>
          <Text style={styles.emptyText}>
            Aún no hay reseñas para este profesional
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.reviewsList}>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.clientName}>
                  {review.client?.full_name || 'Usuario'}
                </Text>
                <Text style={styles.reviewDate}>
                  {formatDate(review.created_at)}
                </Text>
              </View>
              
              {renderStars(review.rating)}
              
              {review.comment && (
                <Text style={styles.comment}>{review.comment}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryContainer: {
    backgroundColor: '#f0f4f8',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  ratingBox: {
    alignItems: 'center',
  },
  averageNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    fontSize: 24,
    marginHorizontal: 2,
  },
  totalReviews: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  reviewsList: {
    flex: 1,
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  comment: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginTop: 8,
  },
});
