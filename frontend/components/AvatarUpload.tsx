import { useState } from 'react';
import { View, TouchableOpacity, Image, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../src/lib/supabase';

interface AvatarUploadProps {
  userId: string;
  currentUrl?: string | null;
  onUpload: (url: string) => void;
  size?: number;
  editable?: boolean;
}

export default function AvatarUpload({ 
  userId, 
  currentUrl, 
  onUpload,
  size = 120,
  editable = true
}: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);

  async function pickImage() {
    if (!editable) return;

    try {
      // Pedir permisos
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos acceso a tu galería para cambiar la foto de perfil'
        );
        return;
      }

      // Abrir selector de imágenes
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
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

      // Convertir URI a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Crear nombre único para el archivo
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      console.log('📤 Subiendo imagen:', filePath);

      // Subir a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { 
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
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;
      console.log('🔗 URL pública:', publicUrl);

      // Actualizar en la tabla users
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user:', updateError);
        throw updateError;
      }

      // Eliminar la imagen anterior si existe
      if (currentUrl) {
        const oldPath = currentUrl.split('/avatars/')[1];
        if (oldPath && oldPath !== filePath) {
          await supabase.storage.from('avatars').remove([oldPath]);
          console.log('🗑️ Imagen anterior eliminada');
        }
      }

      onUpload(publicUrl);
      Alert.alert('¡Éxito!', 'Foto de perfil actualizada');
      
    } catch (error: any) {
      console.error('Error en uploadImage:', error);
      Alert.alert('Error', error.message || 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  return (
    <TouchableOpacity 
      onPress={pickImage} 
      disabled={uploading || !editable}
      style={styles.container}
    >
      <View style={[styles.avatarContainer, { width: size, height: size }]}>
        {uploading ? (
          <View style={[styles.placeholder, { borderRadius: size / 2 }]}>
            <ActivityIndicator size="large" color="#1e3a5f" />
          </View>
        ) : currentUrl ? (
          <Image 
            source={{ uri: currentUrl }} 
            style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
          />
        ) : (
          <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>Sin foto</Text>
          </View>
        )}
        
        {editable && (
          <View style={styles.editBadge}>
            <Text style={styles.editIcon}>✏️</Text>
          </View>
        )}
      </View>
      
      {editable && (
        <Text style={styles.changeText}>
          {uploading ? 'Subiendo...' : currentUrl ? 'Cambiar foto' : 'Agregar foto'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#f0f0f0',
  },
  placeholder: {
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
  },
  placeholderText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#1e3a5f',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editIcon: {
    fontSize: 14,
  },
  changeText: {
    marginTop: 8,
    fontSize: 14,
    color: '#1e3a5f',
    fontWeight: '600',
  },
});
