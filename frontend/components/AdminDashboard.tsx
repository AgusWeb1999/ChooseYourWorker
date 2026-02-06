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
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { LineChart, BarChart } from 'react-native-chart-kit';

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
  totalJobRequests: number;
}

interface DailyStats {
  date: string;
  clients: number;
  professionals: number;
  hires: number;
  jobRequests: number;
}

interface Hire {
  id: string;
  client_id: string;
  professional_id: string;
  status: string;
  created_at: string;
  client?: {
    full_name: string;
    email: string;
  };
  professional?: {
    full_name: string;
    email: string;
  };
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
    totalJobRequests: 0,
  });
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [hires, setHires] = useState<Hire[]>([]);
  const [filteredHires, setFilteredHires] = useState<Hire[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'clients' | 'professionals'>('all');
  const [hireFilterStatus, setHireFilterStatus] = useState<'all' | 'pending' | 'accepted' | 'completed' | 'cancelled'>('all');
  const [chartPeriod, setChartPeriod] = useState<7 | 30 | 90>(30);
  const [activeSection, setActiveSection] = useState<'stats' | 'clients' | 'professionals' | 'hires'>('stats');
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
  }, [isAdmin, chartPeriod]);


  useEffect(() => {
    filterHires();
  }, [hireFilterStatus, hires]);
  useEffect(() => {
    filterUsers();
  }, [searchQuery, filterType, users, activeSection]);

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
        supabase.from('users').select('id, is_professional, created_at'),
        supabase.from('hires').select('id, status, created_at'),
        supabase.from('reviews').select('rating'),
      ]);

      // Intentar cargar job_requests si existe la tabla
      let jobRequestsData: { data: any[] | null; error: any } = { data: [], error: null };
      try {
        const result = await supabase.from('job_requests').select('id, created_at');
        jobRequestsData = result;
      } catch (error) {
        console.log('ℹ️ Tabla job_requests no existe o no es accesible');
      }

      console.log('📊 Datos cargados:');
      console.log('  - Total usuarios:', usersData.data?.length);
      console.log('  - Total contrataciones:', hiresData.data?.length);
      console.log('  - Total reseñas:', reviewsData.data?.length);
      console.log('  - Total solicitudes de trabajo:', jobRequestsData.data?.length);

      // Contar profesionales (usuarios con is_professional = true)
      const totalProfessionals = usersData.data?.filter((u) => u.is_professional).length || 0;
      
      // Contar clientes (usuarios con is_professional = false)
      const totalClients = usersData.data?.filter((u) => !u.is_professional).length || 0;
      
      console.log('  - Clientes (is_professional=false):', totalClients);
      console.log('  - Profesionales (is_professional=true):', totalProfessionals);
      
      // Contar hires por status
      const pending = hiresData.data?.filter((h) => h.status === 'pending').length || 0;
      const accepted = hiresData.data?.filter((h) => h.status === 'in_progress' || h.status === 'accepted').length || 0;
      const completed = hiresData.data?.filter((h) => h.status === 'completed').length || 0;
      const cancelled = hiresData.data?.filter((h) => h.status === 'cancelled' || h.status === 'rejected').length || 0;
      
      console.log('  - Pendientes:', pending);
      console.log('  - Aceptadas/En progreso:', accepted);
      console.log('  - Completadas:', completed);
      console.log('  - Canceladas:', cancelled);
      
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
        totalJobRequests: jobRequestsData.data?.length || 0,
      });

      // Cargar estadísticas históricas
      await loadDailyStats(usersData.data || [], hiresData.data || [], jobRequestsData.data || []);

      // Cargar lista de usuarios
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id, full_name, email, phone, is_professional, created_at, subscription_type, country, city')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('❌ Error fetching users:', usersError);
        setToast({ message: 'Error al cargar usuarios: ' + usersError.message, type: 'error' });
      }

      if (allUsers) {
        console.log('✅ Total usuarios cargados para la lista:', allUsers.length);

      // Cargar contrataciones con información de clientes y profesionales
      const { data: hiresWithDetails, error: hiresError } = await supabase
        .from('hires')
        .select(`
          id,
          client_id,
          professional_id,
          status,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (hiresError) {
        console.error('❌ Error fetching hires:', hiresError);
        setToast({ message: 'Error al cargar contrataciones: ' + hiresError.message, type: 'error' });
      }

      if (hiresWithDetails) {
        console.log('✅ Total contrataciones cargadas:', hiresWithDetails.length);
        
        // Enriquecer con datos de usuarios
        const enrichedHires = hiresWithDetails.map((hire) => {
          const client = allUsers?.find((u) => u.id === hire.client_id);
          const professional = allUsers?.find((u) => u.id === hire.professional_id && u.is_professional === true);
          
          console.log(`Hire ${hire.id.substring(0, 8)}: client_id=${hire.client_id}, professional_id=${hire.professional_id}`);
          if (hire.professional_id) {
            const foundUser = allUsers?.find((u) => u.id === hire.professional_id);
            console.log(`  Found user for professional_id: ${foundUser ? foundUser.full_name : 'NOT FOUND'}, is_professional=${foundUser?.is_professional}`);
          }
          
          return {
            ...hire,
            client: client ? { full_name: client.full_name, email: client.email } : undefined,
            professional: professional ? { full_name: professional.full_name, email: professional.email } : undefined,
          };
        });
        
        setHires(enrichedHires);
      }
        setUsers(allUsers);
      } else {
        console.log('⚠️ No se retornaron usuarios de la base de datos');
      }
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      setToast({ message: 'Error al cargar datos del dashboard', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function loadDailyStats(users: any[], hires: any[], jobRequests: any[]) {
    try {
      // Calcular estadísticas por día para los últimos N días
      const days = chartPeriod;
      const dailyData: DailyStats[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dateStr = date.toISOString().split('T')[0];
        
        // Contar clientes creados en este día
        const clientsOnDay = users.filter((u: any) => {
          const createdAt = new Date(u.created_at);
          return !u.is_professional && createdAt >= date && createdAt < nextDate;
        }).length;
        
        // Contar profesionales creados en este día
        const professionalsOnDay = users.filter((u: any) => {
          const createdAt = new Date(u.created_at);
          return u.is_professional && createdAt >= date && createdAt < nextDate;
        }).length;
        
        // Contar contrataciones creadas en este día
        const hiresOnDay = hires.filter((h: any) => {
          const createdAt = new Date(h.created_at);
          return createdAt >= date && createdAt < nextDate;
        }).length;
        
        // Contar solicitudes de trabajo creadas en este día
        const jobRequestsOnDay = jobRequests.filter((jr: any) => {
          const createdAt = new Date(jr.created_at);
          return createdAt >= date && createdAt < nextDate;
        }).length;
        
        dailyData.push({
          date: dateStr,
          clients: clientsOnDay,
          professionals: professionalsOnDay,
          hires: hiresOnDay,
          jobRequests: jobRequestsOnDay,
        });
      }
      
      console.log('📈 Estadísticas diarias calculadas:', dailyData.length, 'días');
      setDailyStats(dailyData);
    } catch (error) {
      console.error('❌ Error calculando estadísticas diarias:', error);
    }
  }

  function filterHires() {
    let filtered = hires;

    // Filtrar por estado
    if (hireFilterStatus === 'pending') {
      filtered = filtered.filter((h) => h.status === 'pending');
    } else if (hireFilterStatus === 'accepted') {
      filtered = filtered.filter((h) => h.status === 'accepted' || h.status === 'in_progress');
    } else if (hireFilterStatus === 'completed') {
      filtered = filtered.filter((h) => h.status === 'completed');
    } else if (hireFilterStatus === 'cancelled') {
      filtered = filtered.filter((h) => h.status === 'cancelled' || h.status === 'rejected');
    }

    setFilteredHires(filtered);
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return '#f59e0b';
      case 'accepted':
      case 'in_progress':
        return '#6366f1';
      case 'completed':
        return '#10b981';
      case 'cancelled':
      case 'rejected':
        return '#ef4444';
      default:
        return '#94a3b8';
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'accepted':
        return 'Aceptada';
      case 'in_progress':
        return 'En Progreso';
      case 'completed':
        return 'Completada';
      case 'cancelled':
        return 'Cancelada';
      case 'rejected':
        return 'Rechazada';
      default:
        return status;
    }
  }

  function filterUsers() {
    let filtered = users;

    // Filtrar por tipo según activeSection
    if (activeSection === 'clients') {
      filtered = filtered.filter((u) => !u.is_professional);
    } else if (activeSection === 'professionals') {
      filtered = filtered.filter((u) => u.is_professional);
    } else if (filterType === 'clients') {
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

        {/* Navigation Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeSection === 'stats' && styles.tabButtonActive]}
            onPress={() => setActiveSection('stats')}
          >
            <Text style={[styles.tabButtonText, activeSection === 'stats' && styles.tabButtonTextActive]}>
              📊 Estadísticas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeSection === 'clients' && styles.tabButtonActive]}
            onPress={() => setActiveSection('clients')}
          >
            <Text style={[styles.tabButtonText, activeSection === 'clients' && styles.tabButtonTextActive]}>
              👥 Clientes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeSection === 'professionals' && styles.tabButtonActive]}
            onPress={() => setActiveSection('professionals')}
          >
            <Text style={[styles.tabButtonText, activeSection === 'professionals' && styles.tabButtonTextActive]}>
              👨‍💼 Profesionales
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeSection === 'hires' && styles.tabButtonActive]}
            onPress={() => setActiveSection('hires')}
          >
            <Text style={[styles.tabButtonText, activeSection === 'hires' && styles.tabButtonTextActive]}>
              🤝 Contrataciones
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        {activeSection === 'stats' && (
        <>
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

        {/* Charts Section */}
        <View style={styles.chartsSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>📈 Crecimiento de la Plataforma</Text>
            <View style={styles.periodButtons}>
              <TouchableOpacity
                style={[styles.periodButton, chartPeriod === 7 && styles.periodButtonActive]}
                onPress={() => setChartPeriod(7)}
              >
                <Text style={[styles.periodButtonText, chartPeriod === 7 && styles.periodButtonTextActive]}>7D</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodButton, chartPeriod === 30 && styles.periodButtonActive]}
                onPress={() => setChartPeriod(30)}
              >
                <Text style={[styles.periodButtonText, chartPeriod === 30 && styles.periodButtonTextActive]}>30D</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodButton, chartPeriod === 90 && styles.periodButtonActive]}
                onPress={() => setChartPeriod(90)}
              >
                <Text style={[styles.periodButtonText, chartPeriod === 90 && styles.periodButtonTextActive]}>90D</Text>
              </TouchableOpacity>
            </View>
          </View>

          {dailyStats.length > 0 ? (
            <>
              {/* Gráfica de Clientes */}
              <View style={styles.chartCard}>
                <Text style={styles.chartCardTitle}>👥 Clientes Nuevos por Día</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <BarChart
                    data={{
                      labels: dailyStats.map((d) => {
                        const date = new Date(d.date);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }),
                      datasets: [
                        {
                          data: dailyStats.map((d) => d.clients),
                        },
                      ],
                    }}
                    width={Math.max(Dimensions.get('window').width - 60, dailyStats.length * 30)}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: '#3b82f6',
                      backgroundGradientFrom: '#3b82f6',
                      backgroundGradientTo: '#60a5fa',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: '',
                        stroke: 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                    style={styles.chart}
                  />
                </ScrollView>
                <Text style={styles.chartSummary}>
                  Total nuevos clientes en el período: {dailyStats.reduce((sum, d) => sum + d.clients, 0)}
                </Text>
              </View>

              {/* Gráfica de Profesionales */}
              <View style={styles.chartCard}>
                <Text style={styles.chartCardTitle}>👨‍💼 Profesionales Nuevos por Día</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <BarChart
                    data={{
                      labels: dailyStats.map((d) => {
                        const date = new Date(d.date);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }),
                      datasets: [
                        {
                          data: dailyStats.map((d) => d.professionals),
                        },
                      ],
                    }}
                    width={Math.max(Dimensions.get('window').width - 60, dailyStats.length * 30)}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: '#10b981',
                      backgroundGradientFrom: '#10b981',
                      backgroundGradientTo: '#34d399',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: '',
                        stroke: 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                    style={styles.chart}
                  />
                </ScrollView>
                <Text style={styles.chartSummary}>
                  Total nuevos profesionales en el período: {dailyStats.reduce((sum, d) => sum + d.professionals, 0)}
                </Text>
              </View>

              {/* Gráfica de Contrataciones */}
              <View style={styles.chartCard}>
                <Text style={styles.chartCardTitle}>🤝 Contrataciones por Día</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart
                    data={{
                      labels: dailyStats.map((d) => {
                        const date = new Date(d.date);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }),
                      datasets: [
                        {
                          data: dailyStats.map((d) => d.hires),
                        },
                      ],
                    }}
                    width={Math.max(Dimensions.get('window').width - 60, dailyStats.length * 30)}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: '#8b5cf6',
                      backgroundGradientFrom: '#8b5cf6',
                      backgroundGradientTo: '#a78bfa',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForDots: {
                        r: '4',
                        strokeWidth: '2',
                        stroke: '#fff',
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: '',
                        stroke: 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </ScrollView>
                <Text style={styles.chartSummary}>
                  Total contrataciones en el período: {dailyStats.reduce((sum, d) => sum + d.hires, 0)}
                </Text>
              </View>

              {/* Gráfica Combinada */}
              <View style={styles.chartCard}>
                <Text style={styles.chartCardTitle}>📊 Resumen General</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <LineChart
                    data={{
                      labels: dailyStats.map((d) => {
                        const date = new Date(d.date);
                        return `${date.getDate()}/${date.getMonth() + 1}`;
                      }),
                      datasets: [
                        {
                          data: dailyStats.map((d) => d.clients),
                          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Azul para clientes
                          strokeWidth: 2,
                        },
                        {
                          data: dailyStats.map((d) => d.professionals),
                          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Verde para profesionales
                          strokeWidth: 2,
                        },
                        {
                          data: dailyStats.map((d) => d.hires),
                          color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`, // Púrpura para contrataciones
                          strokeWidth: 2,
                        },
                      ],
                      legend: ['Clientes', 'Profesionales', 'Contrataciones'],
                    }}
                    width={Math.max(Dimensions.get('window').width - 60, dailyStats.length * 30)}
                    height={220}
                    yAxisLabel=""
                    yAxisSuffix=""
                    chartConfig={{
                      backgroundColor: '#1e3a8a',
                      backgroundGradientFrom: '#1e3a8a',
                      backgroundGradientTo: '#3b82f6',
                      decimalPlaces: 0,
                      color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                      style: {
                        borderRadius: 16,
                      },
                      propsForDots: {
                        r: '3',
                        strokeWidth: '2',
                        stroke: '#fff',
                      },
                      propsForBackgroundLines: {
                        strokeDasharray: '',
                        stroke: 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                    bezier
                    style={styles.chart}
                  />
                </ScrollView>
                <View style={styles.legendContainer}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#3b82f6' }]} />
                    <Text style={styles.legendText}>Clientes</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#10b981' }]} />
                    <Text style={styles.legendText}>Profesionales</Text>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: '#8b5cf6' }]} />
                    <Text style={styles.legendText}>Contrataciones</Text>
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyChartText}>Cargando datos de gráficas...</Text>
            </View>
          )}
        </View>
        </>
        )}

        {/* Clients Section */}
        {(activeSection === 'clients' || activeSection === 'professionals') && (
        <>
        {/* Filters */}
        <View style={styles.filtersSection}>
          <Text style={styles.sectionTitle}>👥 Usuarios</Text>
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
            Lista de Usuarios ({filteredUsers.length})
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
        </>
        )}

        {/* Hires Section */}
        {activeSection === 'hires' && (
        <>
        <View style={styles.hiresSection}>
          <Text style={styles.sectionTitle}>🤝 Contrataciones</Text>
          
          {/* Hire Filters */}
          <View style={styles.filterButtons}>
            <TouchableOpacity
              style={[styles.filterButton, hireFilterStatus === 'all' && styles.filterButtonActive]}
              onPress={() => setHireFilterStatus('all')}
            >
              <Text style={[styles.filterButtonText, hireFilterStatus === 'all' && styles.filterButtonTextActive]}>
                Todas ({hires.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, hireFilterStatus === 'pending' && styles.filterButtonActive]}
              onPress={() => setHireFilterStatus('pending')}
            >
              <Text style={[styles.filterButtonText, hireFilterStatus === 'pending' && styles.filterButtonTextActive]}>
                Pendientes ({stats.pendingHires})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, hireFilterStatus === 'accepted' && styles.filterButtonActive]}
              onPress={() => setHireFilterStatus('accepted')}
            >
              <Text style={[styles.filterButtonText, hireFilterStatus === 'accepted' && styles.filterButtonTextActive]}>
                Aceptadas ({stats.acceptedHires})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, hireFilterStatus === 'completed' && styles.filterButtonActive]}
              onPress={() => setHireFilterStatus('completed')}
            >
              <Text style={[styles.filterButtonText, hireFilterStatus === 'completed' && styles.filterButtonTextActive]}>
                Completadas ({stats.completedHires})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, hireFilterStatus === 'cancelled' && styles.filterButtonActive]}
              onPress={() => setHireFilterStatus('cancelled')}
            >
              <Text style={[styles.filterButtonText, hireFilterStatus === 'cancelled' && styles.filterButtonTextActive]}>
                Canceladas ({stats.cancelledHires})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hires List */}
          <View style={styles.hiresListSection}>
            <Text style={styles.sectionSubtitle}>
              Mostrando {filteredHires.length} contratacion{filteredHires.length !== 1 ? 'es' : ''}
            </Text>
            {filteredHires.map((hire) => (
              <View key={hire.id} style={styles.hireCard}>
                <View style={styles.hireHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(hire.status) }]}>
                    <Text style={styles.statusBadgeText}>{getStatusLabel(hire.status)}</Text>
                  </View>
                  <Text style={styles.hireDate}>
                    {new Date(hire.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                </View>

                <View style={styles.hireParties}>
                  <View style={styles.hireParty}>
                    <Text style={styles.hirePartyLabel}>👤 Cliente:</Text>
                    <Text style={styles.hirePartyName}>{hire.client?.full_name || 'Desconocido'}</Text>
                    <Text style={styles.hirePartyEmail}>{hire.client?.email || '-'}</Text>
                  </View>

                  <Text style={styles.hireArrow}>→</Text>

                  <View style={styles.hireParty}>
                    <Text style={styles.hirePartyLabel}>👨‍💼 Profesional:</Text>
                    <Text style={styles.hirePartyName}>{hire.professional?.full_name || 'Desconocido'}</Text>
                    <Text style={styles.hirePartyEmail}>{hire.professional?.email || '-'}</Text>
                  </View>
                </View>

                <View style={styles.hireId}>
                  <Text style={styles.hireIdText}>ID: {hire.id.substring(0, 8)}...</Text>
                </View>
              </View>
            ))}
            {filteredHires.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No se encontraron contrataciones</Text>
              </View>
            )}
          </View>
        </View>
        </>
        )}
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
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 12,
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
  chartsSection: {
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  periodButtonActive: {
    backgroundColor: '#1e3a8a',
    borderColor: '#1e3a8a',
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartSummary: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  emptyChart: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  emptyChartText: {
    fontSize: 16,
    color: '#94a3b8',
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
  hiresSection: {
    marginBottom: 24,
  },
  hiresListSection: {
    marginTop: 16,
  },
  hireCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#e2e8f0',
  },
  hireHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  hireDate: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  hireParties: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  hireParty: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
  },
  hirePartyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  hirePartyName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  hirePartyEmail: {
    fontSize: 12,
    color: '#64748b',
  },
  hireArrow: {
    fontSize: 24,
    color: '#3b82f6',
    fontWeight: '700',
  },
  hireMessage: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    marginBottom: 8,
  },
  hireMessageLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  hireMessageText: {
    fontSize: 14,
    color: '#1e293b',
    lineHeight: 20,
  },
  hireId: {
    marginTop: 4,
  },
  hireIdText: {
    fontSize: 10,
    color: '#94a3b8',
    fontFamily: 'monospace',
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    marginBottom: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#1e3a8a',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
});
