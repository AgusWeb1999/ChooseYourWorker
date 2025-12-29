import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, Text, View, TouchableOpacity, Alert, Modal, 
  ScrollView, Switch, Linking, Platform, SafeAreaView, Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

// Components
import OnboardingModal from '../../components/OnboardingModal';
import EditProfessionalProfile from '../../components/EditProfessionalProfile';
import EditClientProfile from '../../components/EditClientProfile';
import ClientHirings from '../../components/ClientHirings';
import ProfessionalJobs from '../../components/ProfessionalJobs';
import WorkPortfolio from '../../components/WorkPortfolio';
import AvatarUpload from '../../components/AvatarUpload';

// Utils
import { setOnboardingSeen, hasSeenOnboarding } from '../../utils/onboarding';

export default function ProfileScreen() {
  const { 
    user, userProfile, professionalProfile, signOut, 
    refreshProfiles, isSubscriptionActive 
  } = useAuth();
  const router = useRouter();

  // Modales Visibility State
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editClientModalVisible, setEditClientModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  const [hiringsModalVisible, setHiringsModalVisible] = useState(false);
  const [jobsModalVisible, setJobsModalVisible] = useState(false);
  const [portfolioModalVisible, setPortfolioModalVisible] = useState(false);
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showProfile, setShowProfile] = useState(true);

  // 1. Efecto Onboarding
  useEffect(() => {
    if (userProfile) {
      const tipo = userProfile.is_professional ? 'profesional' : 'cliente';
      if (!hasSeenOnboarding(tipo)) {
        setOnboardingVisible(true);
        setOnboardingSeen(tipo);
      }
    }
  }, [userProfile]);

  // Handlers
  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = () => {
    setLogoutModalVisible(false);
    signOut();
  };

  const handleProfileSaved = async () => {
    setEditModalVisible(false);
    await refreshProfiles();
  };

  const handleClientProfileSaved = async () => {
    setEditClientModalVisible(false);
    await refreshProfiles();
  };

  const handleSendEmail = async () => {
    const email = 'workinggoam@gmail.com';
    const url = `mailto:${email}?subject=Consulta%20desde%20WorkingGo`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Error', 'No se pudo abrir la aplicación de correo.');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert('Eliminar Cuenta', '¿Estás seguro? Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => Alert.alert('Aviso', 'Función en desarrollo.') }
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.profileLimiter}>
              {/* Modal personalizado para cerrar sesión */}
              <Modal
                visible={logoutModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setLogoutModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.customModalContent}>
                    <Text style={styles.modalTitle}>Cerrar Sesión</Text>
                    <Text style={{marginVertical: 16}}>¿Estás seguro que deseas cerrar sesión?</Text>
                    <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
                      <TouchableOpacity onPress={() => setLogoutModalVisible(false)} style={[styles.modalButton, {backgroundColor:'#e5e7eb'}]}>
                        <Text style={{color:'#374151'}}>Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={confirmLogout} style={[styles.modalButton, {backgroundColor:'#ef4444', marginLeft: 10}]}> 
                        <Text style={{color:'#fff', fontWeight:'bold'}}>Cerrar Sesión</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
        
        {/* Header de Perfil */}
        <View style={styles.mobileProfileHeader}>
          <AvatarUpload 
            userId={userProfile?.id || ''}
            currentUrl={userProfile?.avatar_url}
            onUpload={refreshProfiles}
            size={100}
            editable={true}
          />
          <Text style={styles.mobileProfileName}>{userProfile?.full_name || 'Usuario'}</Text>
          <Text style={styles.mobileProfileEmail}>{user?.email}</Text>
          <View style={styles.mobileProfileBadge}>
            <Text style={styles.mobileProfileBadgeText}>
              {userProfile?.is_professional ? 'Cuenta Profesional' : 'Cuenta Cliente'}
            </Text>
          </View>
        </View>

        {/* Sección de Menú Principal */}
        <View style={styles.section}>
          {userProfile?.is_professional ? (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={() => setEditModalVisible(true)}>
                <Text style={styles.menuText}>Editar Perfil Profesional</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.menuItem, styles.menuItemHighlight]} onPress={() => setJobsModalVisible(true)}>
                <Text style={styles.menuTextHighlight}>Mis Trabajos</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.menuItem, styles.menuItemPortfolio]} onPress={() => setPortfolioModalVisible(true)}>
                <Text style={styles.menuTextPortfolio}>📸 Portafolio de Trabajos</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => router.push(isSubscriptionActive ? '/subscription/manage' : '/subscription/plan')}
              >
                <Text style={styles.menuText}>{isSubscriptionActive ? 'Gestionar Suscripción' : 'Ver Planes Premium'}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity style={styles.menuItem} onPress={() => setEditClientModalVisible(true)}>
                <Text style={styles.menuText}>Editar Mi Perfil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.menuItem, styles.menuItemHighlight]} onPress={() => setHiringsModalVisible(true)}>
                <Text style={styles.menuTextHighlight}>Mis Contrataciones</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.menuItem} onPress={() => setHelpModalVisible(true)}>
            <Text style={styles.menuText}>Ayuda</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => setAboutModalVisible(true)}>
            <Text style={styles.menuText}>Acerca de Nosotros</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- MODALES --- */}

      <OnboardingModal 
        visible={onboardingVisible} 
        onClose={() => setOnboardingVisible(false)} 
        isProfessional={!!userProfile?.is_professional} 
      />

      {/* Modal Editar Profesional */}
      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        {professionalProfile && (
          <EditProfessionalProfile 
            professionalProfile={professionalProfile} 
            onSave={handleProfileSaved} 
            onCancel={() => setEditModalVisible(false)} 
          />
        )}
      </Modal>

      {/* Modal Editar Cliente */}
      <Modal visible={editClientModalVisible} animationType="slide" presentationStyle="pageSheet">
        {userProfile && (
          <EditClientProfile 
            userProfile={userProfile} 
            userEmail={user?.email || ''} 
            onSave={handleClientProfileSaved} 
            onCancel={() => setEditClientModalVisible(false)} 
          />
        )}
      </Modal>

      {/* Modal Ayuda */}
      <Modal visible={helpModalVisible} animationType="slide">
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ayuda y Soporte</Text>
            <TouchableOpacity onPress={() => setHelpModalVisible(false)}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
          </View>
          <View style={styles.modalContentLimiter}>
            <ScrollView style={styles.modalContent}>
              <Text style={styles.helpQuestion}>¿Cómo funciona la plataforma?</Text>
              <Text style={styles.helpAnswer}>WorkingGo conecta clientes con profesionales calificados. Los clientes pueden buscar trabajadores por profesión y ubicación, mientras que los trabajadores pueden ofrecer sus servicios.</Text>
              <Text style={styles.helpQuestion}>¿Cómo actualizo mi perfil?</Text>
              <Text style={styles.helpAnswer}>Toca "Editar Perfil Profesional" en la pantalla de perfil para actualizar tu información, tarifas y experiencia.</Text>
              <Text style={styles.helpQuestion}>¿Cómo me comunico con soporte?</Text>
              <Text style={styles.helpAnswer}>Puedes contactarnos enviando un email a workinggoam@gmail.com.</Text>
              <Text style={styles.helpQuestion}>¿Cómo funcionan los pagos?</Text>
              <Text style={styles.helpAnswer}>Los trabajadores establecen sus propias tarifas. El pago se coordina directamente entre el cliente y el trabajador según lo acordado.</Text>
              <TouchableOpacity style={styles.contactButton} onPress={handleSendEmail}>
                <Text style={styles.contactButtonText}>📧 Contactar por Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => {
                  setHelpModalVisible(false);
                  setTimeout(() => setOnboardingVisible(true), 350);
                }}
              >
                <Text style={styles.contactButtonText}>👀 Ver Guía Rápida</Text>
              </TouchableOpacity>
              <View style={styles.versionInfo}>
                <Text style={styles.versionText}>Versión 1.0.0</Text>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal Acerca de */}
      <Modal visible={aboutModalVisible} animationType="slide">
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nosotros</Text>
            <TouchableOpacity onPress={() => setAboutModalVisible(false)}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.aboutText}>WorkingGo fue creada por estudiantes de ingeniería para potenciar el trabajo local.</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modales de Trabajos/Contrataciones */}
      <Modal visible={jobsModalVisible} animationType="slide">
          <SafeAreaView style={{flex:1}}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Mis Trabajos</Text>
                <TouchableOpacity onPress={() => setJobsModalVisible(false)}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
            </View>
            {professionalProfile && <ProfessionalJobs professionalId={professionalProfile.id} />}
          </SafeAreaView>
      </Modal>

      <Modal visible={portfolioModalVisible} animationType="slide">
          <SafeAreaView style={{flex:1}}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Mi Portafolio</Text>
                <TouchableOpacity onPress={() => setPortfolioModalVisible(false)}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
            </View>
            {professionalProfile && <WorkPortfolio professionalId={professionalProfile.id} editable={true} />}
          </SafeAreaView>
      </Modal>

      <Modal visible={hiringsModalVisible} animationType="slide">
          <SafeAreaView style={{flex:1}}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Mis Contrataciones</Text>
                <TouchableOpacity onPress={() => setHiringsModalVisible(false)}><Text style={styles.closeButton}>✕</Text></TouchableOpacity>
            </View>
            {userProfile && <ClientHirings userId={userProfile.id} />}
          </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileLimiter: { flexGrow: 1, alignItems: 'center', paddingVertical: 24, maxWidth: 1100, width: '100%', alignSelf: 'center' },
  customModalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 24, width: 820, alignSelf: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' },
  modalButton: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 8 },
    versionInfo: { alignItems: 'center', marginTop: 30, marginBottom: 10 },
    versionText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  modalContentLimiter: { width: '100%', maxWidth: 820, alignSelf: 'center', flex: 1 },
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  mobileProfileHeader: { alignItems: 'center', padding: 30, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee', width: '100%', maxWidth: 600, alignSelf: 'center', borderRadius: 18, marginTop: 24, marginBottom: 24 },
  mobileProfileName: { fontSize: 22, fontWeight: 'bold', marginTop: 10 },
  mobileProfileEmail: { color: '#666', marginBottom: 10 },
  mobileProfileBadge: { backgroundColor: '#6366f1', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  mobileProfileBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  section: { padding: 20, width: '100%', maxWidth: 600, alignSelf: 'center' },
  menuItem: { padding: 16, backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  menuItemHighlight: { backgroundColor: '#eef2ff', borderColor: '#6366f1' },
  menuItemPortfolio: { backgroundColor: '#fdf2f8', borderColor: '#ec4899' },
  menuText: { fontSize: 16, color: '#1f2937' },
  menuTextHighlight: { fontSize: 16, color: '#4f46e5', fontWeight: 'bold' },
  menuTextPortfolio: { fontSize: 16, color: '#be185d', fontWeight: 'bold' },
  logoutButton: { margin: 20, padding: 16, alignItems: 'center' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  closeButton: { fontSize: 24, color: '#666' },
  modalContent: { padding: 20 },
  helpQuestion: { fontWeight: 'bold', fontSize: 16, marginTop: 15 },
  helpAnswer: { color: '#444', marginBottom: 10 },
  contactButton: { backgroundColor: '#1e3a5f', padding: 15, borderRadius: 10, marginTop: 20, alignItems: 'center' },
  contactButtonText: { color: '#fff', fontWeight: 'bold' },
  aboutText: { fontSize: 16, lineHeight: 24, color: '#333' }
});