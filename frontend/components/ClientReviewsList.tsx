import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../src/lib/supabase';

interface ClientReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  professional: {
    display_name: string;
  };
}

interface ClientReviewsListProps {
  clientId: string;
}

export default function ClientReviewsList({ clientId }: ClientReviewsListProps) {
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    fetchReviews();
    fetchClientRating();
  }, [clientId]);

  async function fetchReviews() {
    try {
      const { data, error } = await supabase
        .from('client_reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          professional:professionals!client_reviews_professional_id_fkey (
            display_name
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // @ts-ignore - Supabase typing issue with nested selects
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching client reviews:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchClientRating() {
    try {
      // Calcular el rating promedio directamente de las reseñas
      const { data, error } = await supabase
        .from('client_reviews')
        .select('rating')
        .eq('client_id', clientId);

      if (!error && data) {
        const totalCount = data.length;
        const avgRating = totalCount > 0 
          ? data.reduce((sum, review) => sum + review.rating, 0) / totalCount 
          : 0;
        
        setAverageRating(avgRating);
        setTotalReviews(totalCount);
      }
    } catch (error) {
      console.error('Error fetching client rating:', error);
    }
  }

  function renderStars(rating: number) {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} style={styles.star}>
            {star <= rating ? '⭐' : '☆'}
          </Text>
        ))}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#1e3a5f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Resumen de Calificación */}
      {totalReviews > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRating}>
            <Text style={styles.averageNumber}>{averageRating.toFixed(1)}</Text>
            <Text style={styles.outOf}>de 5</Text>
          </View>
          <View style={styles.summaryDetails}>
            {renderStars(Math.round(averageRating))}
            <Text style={styles.totalReviewsText}>
              {totalReviews} {totalReviews === 1 ? 'calificación' : 'calificaciones'}
            </Text>
          </View>
        </View>
      )}

      {/* Lista de Reseñas */}
      {reviews.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aún no hay calificaciones de trabajadores</Text>
        </View>
      ) : (
        <ScrollView style={styles.reviewsList}>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  <View style={styles.avatarSmall}>
                    <Text style={styles.avatarSmallText}>
                      {review.professional.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.reviewerName}>
                      {review.professional.display_name}
                    </Text>
                    <Text style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.starsRow}>
                {renderStars(review.rating)}
              </View>

              {review.comment && (
                <Text style={styles.commentText}>{review.comment}</Text>
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
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  summaryRating: {
    alignItems: 'center',
    marginRight: 20,
    paddingRight: 20,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  averageNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1e3a5f',
  },
  outOf: {
    fontSize: 14,
    color: '#666',
  },
  summaryDetails: {
    flex: 1,
  },
  totalReviewsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
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
    borderColor: '#e0e0e0',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e3a5f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarSmallText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#999',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  star: {
    fontSize: 20,
    marginRight: 2,
  },
  commentText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginTop: 8,
  },
});
