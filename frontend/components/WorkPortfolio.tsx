import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../src/lib/supabase';

interface PortfolioImage {
  id: string;
  image_url: string;
  description?: string;
  created_at: string;
}

interface WorkPortfolioProps {
  professionalId: string;
  editable?: boolean;
}

export default function WorkPortfolio({ professionalId, editable = true }: WorkPortfolioProps) {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadPortfolioImages();
  }, [professionalId]);

  async function loadPortfolioImages() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolio_images')
        .select('*')
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImages(data || []);
    } catch (error: any) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  }

  async function pickImage() {
    if (!editable) return;

    try {
      // Verificar límite de imágenes
      if (images.length >= 5) {
        Alert.alert(
          'Límite alcanzado',
          'Puedes subir un máximo de 5 imágenes. Elimina alguna para añadir nuevas.'
        );
        return;
      }

      // Pedir permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos acceso a tu galería para subir fotos de tus trabajos'
        );
        return;
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  }

  async function uploadImage(uri: string) {
    try {
      setUploading(true);

      // Crear nombre único para el archivo
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `portfolio-${Date.now()}.${fileExt}`;
      const filePath = `${professionalId}/${fileName}`;

      console.log('📤 Subiendo imagen del portafolio:', filePath);

      // Convertir URI a ArrayBuffer
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const fileData = new Uint8Array(arrayBuffer);

      // Subir a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(filePath, fileData, { 
          cacheControl: '3600',
          upsert: false,
          contentType: `image/${fileExt}`
        });

      if (uploadError) {
        console.error('Error uploading:', uploadError);
        throw uploadError;
      }

      console.log('✅ Imagen subida:', uploadData);

      // Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from('portfolio')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      // Guardar en la tabla portfolio_images
      const { error: insertError } = await supabase
        .from('portfolio_images')
        .insert({
          professional_id: professionalId,
          image_url: publicUrl,
          description: ''
        });

      if (insertError) {
        console.error('Error saving to database:', insertError);
        throw insertError;
      }

      Alert.alert('¡Éxito!', 'Imagen agregada a tu portafolio');
      await loadPortfolioImages();
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'No se pudo subir la imagen. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  }

  async function deleteImage(imageId: string, imageUrl: string) {
    Alert.alert(
      'Eliminar imagen',
      '¿Estás seguro de que deseas eliminar esta imagen?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Extraer el path del storage desde la URL
              const urlParts = imageUrl.split('/portfolio/');
              if (urlParts.length > 1) {
                const filePath = urlParts[1];
                
                // Eliminar del storage
                await supabase.storage
                  .from('portfolio')
                  .remove([filePath]);
              }

              // Eliminar de la base de datos
              const { error } = await supabase
                .from('portfolio_images')
                .delete()
                .eq('id', imageId);

              if (error) throw error;

              Alert.alert('¡Listo!', 'Imagen eliminada');
              await loadPortfolioImages();
            } catch (error: any) {
              console.error('Error deleting image:', error);
              Alert.alert('Error', 'No se pudo eliminar la imagen');
            }
          }
        }
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Cargando portafolio...</Text>
      </View>
    );
  }

  const screenWidth = Dimensions.get('window').width;
  const imageSize = Platform.OS === 'web' ? 
    Math.min((screenWidth - 80) / 3, 150) : 
    (screenWidth - 60) / 2;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Trabajos</Text>
        <Text style={styles.subtitle}>
          Muestra fotos de tus trabajos realizados ({images.length}/5)
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {/* Botón para agregar imagen */}
        {editable && images.length < 5 && (
          <TouchableOpacity 
            style={[styles.addButton, { width: imageSize, height: imageSize }]}
            onPress={pickImage}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <>
                <Text style={styles.addIcon}>+</Text>
                <Text style={styles.addText}>Agregar foto</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Grid de imágenes */}
        {images.map((image) => (
          <View key={image.id} style={[styles.imageContainer, { width: imageSize, height: imageSize }]}>
            <Image 
              source={{ uri: image.image_url }} 
              style={styles.image}
              resizeMode="cover"
            />
            {editable && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={() => deleteImage(image.id, image.image_url)}
              >
                <Text style={styles.deleteIcon}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {images.length === 0 && !editable && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay imágenes en el portafolio</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  addButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
  },
  addIcon: {
    fontSize: 40,
    color: '#007AFF',
    marginBottom: 5,
  },
  addText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  imageContainer: {
    margin: 5,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  deleteIcon: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});
