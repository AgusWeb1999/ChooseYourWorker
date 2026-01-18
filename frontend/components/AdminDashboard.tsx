import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';

interface DashboardStats {
  totalClients: number;
  totalProfessionals: number;
  totalHires: number;
  pendingHires: number;
  acceptedHires: number;
  completedHires: number;
  cancelledHires: number;
  totalReviews: number;
  averageRating: number;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_professional: boolean;
  created_at: string;
  subscription_type: string | null;
  country: string | null;
  city: string | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    totalProfessionals: 0,
    totalHires: 0,
    pendingHires: 0,
    acceptedHires: 0,
    completedHires: 0,
    cancelledHires: 0,
    totalReviews: 0,
    averageRating: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'clients' | 'professionals'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    is_professional: false,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, filterType, users]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function checkAdminAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setToast({ message: 'Debes iniciar sesión', type: 'error' });
        setTimeout(() => router.replace('/'), 1500);
        setCheckingAuth(false);
        return;
      }

      const { data: userData } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (userData?.is_admin) {
        setIsAdmin(true);
      } else {
        setToast({ message: 'No tienes permisos de administrador', type: 'error' });
        setTimeout(() => router.replace('/'), 1500);
      }
    } catch (error) {
      setToast({ message: 'Error al verificar permisos', type: 'error' });
      setTimeout(() => router.replace('/'), 1500);
    } finally {
      setCheckingAuth(false);
    }
  }

  async function loadDashboardData() {
    try {
      setLoading(true);

      // Cargar estadísticas
      const [usersData, hiresData, reviewsData] = await Promise.all([
        supabase.from('users').select('id, is_professional'),
        supabase.from('hires').select('id, status'),
        supabase.from('reviews').select('rating'),
      ]);

      // Contar profesionales (usuarios con is_professional = true)
      const totalProfessionals = usersData.data?.filter((u) => u.is_professional).length || 0;
      
      // Contar clientes (usuarios con is_professional = false)
      const totalClients = usersData.data?.filter((u) => !u.is_professional).length || 0;
      
      // Contar hires por status
      const pending = hiresData.data?.filter((h) => h.status === 'pending').length || 0;
      const accepted = hiresData.data?.filter((h) => h.status === 'in_progress' || h.status === 'accepted').length || 0;
      const completed = hiresData.data?.filter((h) => h.status === 'completed').length || 0;
      const cancelled = hiresData.data?.filter((h) => h.status === 'cancelled' || h.status === 'rejected').length || 0;
      
      // Rating promedio
      const ratings = reviewsData.data?.map((r) => r.rating) || [];
      const avgRating = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0;

      setStats({
        totalClients,
        totalProfessionals,
        totalHires: hiresData.data?.length || 0,
        pendingHires: pending,
        acceptedHires: accepted,
        completedHires: completed,
        cancelledHires: cancelled,
        totalReviews: reviewsData.data?.length || 0,
        averageRating: avgRating,
      });

      // Cargar lista de usuarios
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, phone, is_professional, created_at, subscription_type, country, city')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
        setToast({ message: 'Error al cargar usuarios: ' + usersError.message, type: 'error' });
      }

      if (allUsers) {
        console.log('Total users fetched:', allUsers.length);
        console.log('Users data:', allUsers);
        setUsers(allUsers);
      } else {
        console.log('No users returned from database');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setToast({ message: 'Error al cargar datos del dashboard', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  function filterUsers() {
    let filtered = users;

    // Filtrar por tipo
    if (filterType === 'clients') {
      filtered = filtered.filter((u) => !u.is_professional);
    } else if (filterType === 'professionals') {
      filtered = filtered.filter((u) => u.is_professional);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.phone?.includes(query)
      );
    }

    setFilteredUsers(filtered);
  }

  function handleEditUser(user: User) {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      city: user.city || '',
      country: user.country || '',
      is_professional: user.is_professional,
    });
    setEditModalVisible(true);
  }

  function handleDeleteUser(user: User) {
    setSelectedUser(user);
    setDeleteConfirmVisible(true);
  }

  async function saveUserEdits() {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editForm.full_name,
          email: editForm.email,
          phone: editForm.phone,
          city: editForm.city,
          country: editForm.country,
          is_professional: editForm.is_professional,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      setToast({ message: 'Usuario actualizado correctamente', type: 'success' });
      setEditModalVisible(false);
      setSelectedUser(null);
      loadDashboardData();
    } catch (error: any) {
      setToast({ message: 'Error al actualizar usuario: ' + error.message, type: 'error' });
    }
  }

  async function confirmDeleteUser() {
    if (!selectedUser) return;

    try {
      // Primero eliminar de la tabla users
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', selectedUser.id);

      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        throw deleteError;
      }

      setToast({ message: 'Usuario eliminado correctamente', type: 'success' });
      setDeleteConfirmVisible(false);
      setSelectedUser(null);
      await loadDashboardData();
    } catch (error: any) {
      console.error('Delete user error:', error);
      setToast({ message: 'Error al eliminar usuario: ' + error.message, type: 'error' });
    }
  }

  if (checkingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Verificando permisos...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.accessDeniedTitle}>⛔ Acceso Denegado</Text>
        <Text style={styles.accessDeniedText}>
          No tienes permisos de administrador para acceder a este panel.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a8a" />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Panel de Administración</Text>
          <Text style={styles.headerSubtitle}>Gestión de usuarios y estadísticas</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <TouchableOpacity 
            style={[styles.statCard, styles.statCardBlue]}
            onPress={() => setFilterType('clients')}
          >
            <Text style={styles.statNumber}>{stats.totalClients}</Text>
            <Text style={styles.statLabel}>Clientes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statCard, styles.statCardGreen]}
            onPress={() => setFilterType('professionals')}
          >
            <Text style={styles.statNumber}>{stats.totalProfessionals}</Text>
            <Text style={styles.statLabel}>Profesionales</Text>
          </TouchableOpacity>
          <View style={[styles.statCard, styles.statCardPurple]}>
            <Text style={styles.statNumber}>{stats.totalHires}</Text>
            <Text style={styles.statLabel}>Propuestas Totales</Text>
          </View>
          <View style={[styles.statCard, styles.statCardYellow]}>
            <Text style={styles.statNumber}>{stats.pendingHires}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
          <View style={[styles.statCard, styles.statCardIndigo]}>
            <Text style={styles.statNumber}>{stats.acceptedHires}</Text>
            <Text style={styles.statLabel}>Aceptadas</Text>
          </View>
          <View style={[styles.statCard, styles.statCardTeal]}>
            <Text style={styles.statNumber}>{stats.completedHires}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
          <View style={[styles.statCard, styles.statCardRed]}>
            <Text style={styles.statNumber}>{stats.cancelledHires}</Text>
            <Text style={styles.statLabel}>Canceladas</Text>
          </View>
          <View style={[styles.statCard, styles.statCardOrange]}>
            <Text style={styles.statNumber}>{stats.totalReviews}</Text>
            <Text style={styles.statLabel}>Reseñas</Text>
          </View>
          <View style={[styles.statCard, styles.statCardPink]}>
            <Text style={styles.statNumber}>{stats.averageRating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating Promedio</Text>
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
              onPress={() => setFilterType('all')}
            >
              <Text style={[styles.filterButtonText, filterType === 'all' && styles.filterButtonTextActive]}>
                Todos ({users.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'clients' && styles.filterButtonActive]}
              onPress={() => setFilterType('clients')}
            >
              <Text style={[styles.filterButtonText, filterType === 'clients' && styles.filterButtonTextActive]}>
                Clientes ({stats.totalClients})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, filterType === 'professionals' && styles.filterButtonActive]}
              onPress={() => setFilterType('professionals')}
            >
              <Text style={[styles.filterButtonText, filterType === 'professionals' && styles.filterButtonTextActive]}>
                Profesionales ({stats.totalProfessionals})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Users List */}
        <View style={styles.usersSection}>
          <Text style={styles.sectionTitle}>
            Usuarios ({filteredUsers.length})
          </Text>
          {filteredUsers.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  <Text style={styles.userName}>{user.full_name}</Text>
                  {user.is_professional && (
                    <View style={styles.professionalBadge}>
                      <Text style={styles.professionalBadgeText}>PRO</Text>
                    </View>
                  )}
                  {user.subscription_type === 'premium' && (
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumBadgeText}>⭐ Premium</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userEmail}>{user.email}</Text>
                {user.phone && <Text style={styles.userPhone}>📞 {user.phone}</Text>}
                {user.country && (
                  <Text style={styles.userLocation}>
                    📍 {user.city}, {user.country}
                  </Text>
                )}
                <Text style={styles.userDate}>
                  Registrado: {new Date(user.created_at).toLocaleDateString('es-ES')}
                </Text>
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditUser(user)}
                >
                  <Text style={styles.editButtonText}>✏️ Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteUser(user)}
                >
                  <Text style={styles.deleteButtonText}>🗑️ Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {filteredUsers.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No se encontraron usuarios</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirmar Eliminación</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de que deseas eliminar a {selectedUser?.full_name}?
              Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setDeleteConfirmVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonDelete}
                onPress={confirmDeleteUser}
              >
                <Text style={styles.modalButtonDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.editModalScrollContent}>
            <View style={[styles.modalContent, styles.editModalContent]}>
              <Text style={styles.modalTitle}>Editar Usuario</Text>
              
              <Text style={styles.inputLabel}>Nombre Completo</Text>
              <TextInput
                style={styles.input}
                value={editForm.full_name}
                onChangeText={(text) => setEditForm({ ...editForm, full_name: text })}
                placeholder="Nombre completo"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                value={editForm.email}
                onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                placeholder="Email"
                keyboardType="email-address"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={editForm.phone}
                onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                placeholder="Teléfono"
                keyboardType="phone-pad"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Ciudad</Text>
              <TextInput
                style={styles.input}
                value={editForm.city}
                onChangeText={(text) => setEditForm({ ...editForm, city: text })}
                placeholder="Ciudad"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>País</Text>
              <TextInput
                style={styles.input}
                value={editForm.country}
                onChangeText={(text) => setEditForm({ ...editForm, country: text })}
                placeholder="País"
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setEditForm({ ...editForm, is_professional: !editForm.is_professional })}
              >
                <View style={[styles.checkbox, editForm.is_professional && styles.checkboxChecked]}>
                  {editForm.is_professional && <Text style={styles.checkboxMark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Es Profesional</Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonCancel}
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonSave}
                  onPress={saveUserEdits}
                >
                  <Text style={styles.modalButtonSaveText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Toast */}
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
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 12,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statCardBlue: {
    backgroundColor: '#3b82f6',
  },
  statCardGreen: {
    backgroundColor: '#10b981',
  },
  statCardPurple: {
    backgroundColor: '#8b5cf6',
  },
  statCardYellow: {
    backgroundColor: '#f59e0b',
  },
  statCardIndigo: {
    backgroundColor: '#6366f1',
  },
  statCardTeal: {
    backgroundColor: '#14b8a6',
  },
  statCardRed: {
    backgroundColor: '#ef4444',
  },
  statCardOrange: {
    backgroundColor: '#f97316',
  },
  statCardPink: {
    backgroundColor: '#ec4899',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  filtersSection: {
    marginBottom: 24,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  usersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
  },
  professionalBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  professionalBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  premiumBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  premiumBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  userDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: '#475569',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  modalButtonDelete: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonDeleteText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  editModalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  editModalContent: {
    maxWidth: 500,
    maxHeight: '90%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkboxMark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  modalButtonSave: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSaveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
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
});
