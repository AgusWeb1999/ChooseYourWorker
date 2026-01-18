import { useState, useEffect, useRef } from 'react';
import { Modal, Pressable } from 'react-native';
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
import PortfolioImageWithFallback from './PortfolioImageWithFallback';

interface WorkPortfolioProps {
  professionalId: string;
  editable?: boolean;
}
interface PortfolioImage {
  id: string;
  image_url: string;
  description?: string;
  created_at: string;
}


export default function WorkPortfolio({ professionalId, editable = true }: WorkPortfolioProps) {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ visible: boolean; imageId: string; imageUrl: string }>({
    visible: false,
    imageId: '',
    imageUrl: ''
  });

  useEffect(() => {
    loadPortfolioImages();
  }, [professionalId]);

  useEffect(() => {
    // Limpiar toast timeout cuando el componente se desmonte
    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, []);

  async function loadPortfolioImages() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('portfolio_images')
        .select('*')
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const validImages = data || [];
      setImages(validImages);
    } catch (error: any) {
      // Error al cargar portafolio
    } finally {
      setLoading(false);
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function pickImage() {
    if (!editable) return;

    try {
      // Verificar límite de imágenes
      if (images.length >= 15) {
        setToast({ message: 'Puedes subir un máximo de 15 imágenes. Elimina alguna para añadir nuevas.', type: 'error' });
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setToast(null), 3000);
        return;
      }

      // En web, usar file input HTML
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            // Validar tamaño (máx 10MB)
            if (file.size > 10 * 1024 * 1024) {
              setToast({ message: 'El archivo debe ser menor a 10MB', type: 'error' });
              if (toastTimeout.current) clearTimeout(toastTimeout.current);
              toastTimeout.current = setTimeout(() => setToast(null), 3000);
              return;
            }
            await uploadImageFromFile(file);
          }
        };
        input.click();
        return;
      }

      // En mobile, usar expo-image-picker
      // Pedir permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        setToast({ message: 'Necesitamos acceso a tu galería para subir fotos', type: 'error' });
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setToast(null), 3000);
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
        // Validar tipo de archivo
        const asset = result.assets[0];
        const allowedTypes = ['jpg', 'jpeg', 'png', 'webp'];
        let fileExt = '';
        if (asset.fileName) {
          fileExt = asset.fileName.split('.').pop()?.toLowerCase() || '';
        } else {
          // fallback: try to get extension from uri
          fileExt = asset.uri.split('.').pop()?.toLowerCase() || '';
        }
        if (!allowedTypes.includes(fileExt)) {
          setToast({ message: 'Solo puedes subir imágenes en formato JPG, JPEG, PNG o WEBP.', type: 'error' });
          if (toastTimeout.current) clearTimeout(toastTimeout.current);
          toastTimeout.current = setTimeout(() => setToast(null), 3000);
          return;
        }
        await uploadImage(asset.uri);
      }
    } catch (error: any) {
      setToast({ message: 'No se pudo seleccionar la imagen', type: 'error' });
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 3000);
    }
  }

  async function uploadImageFromFile(file: File) {
    try {
      setUploading(true);

      // Crear nombre único con UUID para evitar conflictos
      const fileUuid = crypto.randomUUID();
      const fileName = `${fileUuid}.jpg`;
      const filePath = `${professionalId}/${fileName}`;

      // Convertir File a ArrayBuffer y luego a Uint8Array (no Blob)
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Subir a Supabase Storage usando Uint8Array
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(filePath, uint8Array, { 
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from('portfolio')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;
      
      // Validar que la URL es válida antes de guardar
      if (!publicUrl || !publicUrl.startsWith('http')) {
        throw new Error('No se pudo generar una URL válida para la imagen');
      }

      // Guardar en la tabla portfolio_images
      const { error: insertError } = await supabase
        .from('portfolio_images')
        .insert({
          professional_id: professionalId,
          image_url: publicUrl,
          description: ''
        });

      if (insertError) {
        throw insertError;
      }

      setToast({ message: 'Imagen agregada a tu portafolio', type: 'success' });
      await loadPortfolioImages();
    } catch (error: any) {
      setToast({ message: 'No se pudo subir la imagen. Intenta de nuevo.', type: 'error' });
    } finally {
      setUploading(false);
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 3000);
    }
  }

  async function uploadImage(uri: string) {
    try {
      setUploading(true);

      // Crear nombre único con UUID para evitar conflictos
      const fileUuid = crypto.randomUUID();
      const fileName = `${fileUuid}.jpg`;
      const filePath = `${professionalId}/${fileName}`;

      // Convertir URI a ArrayBuffer y luego a Uint8Array
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Subir a Supabase Storage usando Uint8Array
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portfolio')
        .upload(filePath, uint8Array, { 
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const { data: publicUrlData } = supabase.storage
        .from('portfolio')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;
      
      // Validar que la URL es válida antes de guardar
      if (!publicUrl || !publicUrl.startsWith('http')) {
        throw new Error('No se pudo generar una URL válida para la imagen');
      }

      // Guardar en la tabla portfolio_images
      const { error: insertError } = await supabase
        .from('portfolio_images')
        .insert({
          professional_id: professionalId,
          image_url: publicUrl,
          description: ''
        });

      if (insertError) {
        throw insertError;
      }

      setToast({ message: 'Imagen agregada a tu portafolio', type: 'success' });
      await loadPortfolioImages();
    } catch (error: any) {
      setToast({ message: 'No se pudo subir la imagen. Intenta de nuevo.', type: 'error' });
    } finally {
      setUploading(false);
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 3000);
    }
  }

  async function deleteImage(imageId: string, imageUrl: string) {
    setDeleteConfirmModal({ visible: true, imageId, imageUrl });
  }

  async function confirmDelete() {
    const { imageId, imageUrl } = deleteConfirmModal;
    setDeleteConfirmModal({ visible: false, imageId: '', imageUrl: '' });

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

      setToast({ message: 'Imagen eliminada correctamente', type: 'success' });
      await loadPortfolioImages();
    } catch (error: any) {
      setToast({ message: 'Error al eliminar la imagen', type: 'error' });
    } finally {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToast(null), 3000);
    }
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
  // Responsive image sizing
  // Web Desktop (>900px): 3 columnas, máx 180px
  // Web Tablet (600-900px): 2 columnas, máx 160px
  // Web Mobile (<600px): 2 columnas, responsive
  // Mobile nativo: 2 columnas, responsive
  let numColumns = 2;
  let maxImageSize = 160;
  if (Platform.OS === 'web') {
    if (screenWidth >= 900) {
      numColumns = 3;
      maxImageSize = 180;
    } else if (screenWidth >= 600) {
      numColumns = 2;
      maxImageSize = 160;
    } else {
      numColumns = 2;
      maxImageSize = 140;
    }
  }
  const imageSize = Math.min((screenWidth - 40 - (numColumns * 10)) / numColumns, maxImageSize);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Trabajos realizados:</Text>
      </View>

      <ScrollView 
        contentContainerStyle={[styles.grid, { justifyContent: images.length === 1 ? 'flex-start' : 'flex-start' }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Botón para agregar imagen */}
        {editable && images.length < 15 && (
          <TouchableOpacity 
            style={[styles.addButton, { width: imageSize, height: imageSize }]}
            onPress={pickImage}
            disabled={uploading}
            activeOpacity={0.8}
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
        {images
          .filter(image => {
            // Ocultar imágenes que fallaron o tienen URL inválida
            if (failedImages.has(image.id)) return false;
            const imageUrl = image.image_url?.trim();
            return imageUrl && imageUrl.startsWith('http');
          })
          .map((image) => {
          const imageUrl = image.image_url!.trim();
          
          // No renderizar si está en failedImages (doble verificación)
          if (failedImages.has(image.id)) {
            return null;
          }
          
          return (
            <View
              key={image.id}
              style={[styles.imageContainer, { width: imageSize, height: imageSize }]}
            >
              <PortfolioImageWithFallback
                imageUrl={imageUrl}
                imageId={image.id}
                style={styles.image}
                resizeMode="cover"
                onError={() => {
                  setFailedImages(prev => {
                    const newSet = new Set(prev);
                    newSet.add(image.id);
                    return newSet;
                  });
                }}
              />
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => {
                  setSelectedImage(imageUrl);
                  setModalVisible(true);
                }}
              />
              {editable && (
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={(e: any) => {
                    e?.stopPropagation?.();
                    e?.preventDefault?.();
                    deleteImage(image.id, imageUrl);
                  }}
                  activeOpacity={0.8}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={styles.deleteIcon}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Modal para imagen ampliada */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            {selectedImage && (
              <PortfolioImageWithFallback
                imageUrl={selectedImage}
                imageId="modal-preview"
                style={styles.modalImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Pressable>
      </Modal>

      {images.length === 0 && !editable && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No hay imágenes en el portafolio</Text>
        </View>
      )}

      {/* Modal de confirmación de eliminación */}
      <Modal
        visible={deleteConfirmModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmModal({ visible: false, imageId: '', imageUrl: '' })}
      >
        <Pressable 
          style={styles.confirmModalOverlay} 
          onPress={() => setDeleteConfirmModal({ visible: false, imageId: '', imageUrl: '' })}
        >
          <Pressable style={styles.confirmModalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.confirmModalTitle}>Eliminar imagen</Text>
            <Text style={styles.confirmModalMessage}>
              ¿Estás seguro de que deseas eliminar esta imagen?
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.confirmModalButtonCancel]}
                onPress={() => setDeleteConfirmModal({ visible: false, imageId: '', imageUrl: '' })}
              >
                <Text style={styles.confirmModalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmModalButton, styles.confirmModalButtonDelete]}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmModalButtonTextDelete}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toast.message}</Text>
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
    justifyContent: 'flex-start',
  },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContent: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '90%',
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      alignSelf: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
    modalImage: {
      width: '100%',
      height: 340,
      maxWidth: 400,
      maxHeight: 340,
      borderRadius: 8,
      backgroundColor: '#eee',
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
  brokenImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  brokenImageText: {
    fontSize: 32,
    marginBottom: 4,
  },
  brokenImageSubtext: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
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
    zIndex: 10,
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
  toast: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    zIndex: 1000,
    elevation: 5,
  },
  toastSuccess: {
    backgroundColor: '#10b981',
  },
  toastError: {
    backgroundColor: '#ef4444',
  },
  toastText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModalContent: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmModalMessage: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  confirmModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalButtonCancel: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  confirmModalButtonDelete: {
    backgroundColor: '#ef4444',
  },
  confirmModalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  confirmModalButtonTextDelete: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
