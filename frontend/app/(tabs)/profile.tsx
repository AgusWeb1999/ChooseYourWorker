import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Modal, ScrollView, Switch } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import EditProfessionalProfile from '../../components/EditProfessionalProfile';
import EditClientProfile from '../../components/EditClientProfile';
import ReviewsList from '../../components/ReviewsList';
import ClientReviewsList from '../../components/ClientReviewsList';
import AvatarUpload from '../../components/AvatarUpload';

export default function ProfileScreen() {
  const { user, userProfile, professionalProfile, signOut, refreshProfiles } = useAuth();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editClientModalVisible, setEditClientModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);
  
  // Settings state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [showProfile, setShowProfile] = useState(true);

  function handleLogout() {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: signOut },
      ]
    );
  }

  async function handleProfileSaved() {
    setEditModalVisible(false);
    await refreshProfiles();
  }

  async function handleClientProfileSaved() {
    setEditClientModalVisible(false);
    await refreshProfiles();
  }

  function handleSettings() {
    setSettingsModalVisible(true);
  }

  function handleHelp() {
    setHelpModalVisible(true);
  }

  function handleAbout() {
    setAboutModalVisible(true);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Eliminar Cuenta',
      '¿Estás seguro? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive', 
          onPress: () => {
            // TODO: Implementar eliminación de cuenta
            Alert.alert('Funcionalidad en desarrollo', 'Esta función estará disponible pronto.');
          }
        },
      ]
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AvatarUpload
          userId={userProfile?.id || ''}
          currentUrl={userProfile?.avatar_url}
          onUpload={async () => {
            await refreshProfiles();
          }}
          size={100}
          editable={true}
        />
        <Text style={styles.name}>{userProfile?.full_name || 'Usuario'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {userProfile?.is_professional ? '🛠️ Trabajador' : '🔍 Cliente'}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        {userProfile?.is_professional && professionalProfile ? (
          <>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => setEditModalVisible(true)}
            >
              <Text style={styles.menuText}>✏️ Editar Perfil Profesional</Text>
            </TouchableOpacity>
            
            {/* Mostrar Rating del Profesional */}
            {professionalProfile.rating > 0 && (
              <View style={styles.ratingCard}>
                <Text style={styles.ratingTitle}>Tu Calificación como Trabajador</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingNumber}>⭐ {professionalProfile.rating.toFixed(1)}</Text>
                  <Text style={styles.ratingCount}>
                    ({professionalProfile.rating_count} {professionalProfile.rating_count === 1 ? 'reseña' : 'reseñas'})
                  </Text>
                </View>
              </View>
            )}
            
            {/* Mostrar Rating como Cliente - Temporalmente deshabilitado
            {userProfile.average_rating > 0 && (
              <View style={styles.ratingCard}>
                <Text style={styles.ratingTitle}>Tu Calificación como Cliente</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingNumber}>⭐ {userProfile.average_rating.toFixed(1)}</Text>
                  <Text style={styles.ratingCount}>
                    ({userProfile.total_reviews} {userProfile.total_reviews === 1 ? 'calificación' : 'calificaciones'})
                  </Text>
                </View>
              </View>
            )}
            */}
          </>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => setEditClientModalVisible(true)}
            >
              <Text style={styles.menuText}>✏️ Editar Mi Perfil</Text>
            </TouchableOpacity>
            
            {/* Mostrar Rating del Cliente - Temporalmente deshabilitado
            {userProfile && userProfile.average_rating > 0 && (
              <View style={styles.ratingCard}>
                <Text style={styles.ratingTitle}>Tu Calificación como Cliente</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingNumber}>⭐ {userProfile.average_rating.toFixed(1)}</Text>
                  <Text style={styles.ratingCount}>
                    ({userProfile.total_reviews} {userProfile.total_reviews === 1 ? 'calificación' : 'calificaciones'})
                  </Text>
                </View>
              </View>
            )}
            */}
          </>
        )}
        <TouchableOpacity style={styles.menuItem} onPress={handleSettings}>
          <Text style={styles.menuText}>⚙️ Configuración</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleHelp}>
          <Text style={styles.menuText}>❓ Ayuda</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
          <Text style={styles.menuText}>ℹ️ Acerca de Nosotros</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      {/* Edit Professional Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        {professionalProfile && (
          <EditProfessionalProfile
            professionalProfile={professionalProfile}
            onSave={handleProfileSaved}
            onCancel={() => setEditModalVisible(false)}
          />
        )}
      </Modal>

      {/* Edit Client Profile Modal */}
      <Modal
        visible={editClientModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditClientModalVisible(false)}
      >
        {userProfile && user && (
          <EditClientProfile
            userProfile={userProfile}
            userEmail={user.email || ''}
            onSave={handleClientProfileSaved}
            onCancel={() => setEditClientModalVisible(false)}
          />
        )}
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Configuración</Text>
            <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Notificaciones</Text>
            
            <View style={styles.settingItem}>
              <View>
                <Text style={styles.settingLabel}>Notificaciones Push</Text>
                <Text style={styles.settingDescription}>
                  Recibe alertas sobre nuevos trabajos y mensajes
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#ddd', true: '#1e3a5f' }}
              />
            </View>

            <View style={styles.settingItem}>
              <View>
                <Text style={styles.settingLabel}>Notificaciones por Email</Text>
                <Text style={styles.settingDescription}>
                  Recibe actualizaciones importantes por correo
                </Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: '#ddd', true: '#1e3a5f' }}
              />
            </View>

            {userProfile?.is_professional && (
              <>
                <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>Privacidad</Text>
                
                <View style={styles.settingItem}>
                  <View>
                    <Text style={styles.settingLabel}>Mostrar Perfil Público</Text>
                    <Text style={styles.settingDescription}>
                      Los clientes pueden ver tu perfil en búsquedas
                    </Text>
                  </View>
                  <Switch
                    value={showProfile}
                    onValueChange={setShowProfile}
                    trackColor={{ false: '#ddd', true: '#1e3a5f' }}
                  />
                </View>
              </>
            )}

            <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>Cuenta</Text>
            
            <TouchableOpacity 
              style={styles.dangerButton}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.dangerButtonText}>🗑️ Eliminar Cuenta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Modal>

      {/* Help Modal */}
      <Modal
        visible={helpModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setHelpModalVisible(false)}
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ayuda y Soporte</Text>
            <TouchableOpacity onPress={() => setHelpModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>

            <View style={styles.helpItem}>
              <Text style={styles.helpQuestion}>¿Cómo funciona la plataforma?</Text>
              <Text style={styles.helpAnswer}>
                WorkingGo conecta clientes con profesionales calificados. 
                Los clientes pueden buscar trabajadores por profesión y ubicación, 
                mientras que los trabajadores pueden ofrecer sus servicios.
              </Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpQuestion}>¿Cómo actualizo mi perfil?</Text>
              <Text style={styles.helpAnswer}>
                {userProfile?.is_professional 
                  ? 'Toca "Editar Perfil Profesional" en la pantalla de perfil para actualizar tu información, tarifas y experiencia.'
                  : 'Puedes actualizar tu información personal en la configuración de tu cuenta.'
                }
              </Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpQuestion}>¿Cómo me comunico con soporte?</Text>
              <Text style={styles.helpAnswer}>
                Puedes contactarnos enviando un email a support@workinggo.com 
                o llamando al 1-800-WORKER-1.
              </Text>
            </View>

            <View style={styles.helpItem}>
              <Text style={styles.helpQuestion}>¿Cómo funcionan los pagos?</Text>
              <Text style={styles.helpAnswer}>
                Los trabajadores establecen sus propias tarifas. El pago se coordina 
                directamente entre el cliente y el trabajador según lo acordado.
              </Text>
            </View>

            <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>Contacto</Text>
            
            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>📧 Enviar Email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactButton}>
              <Text style={styles.contactButtonText}>💬 Chat en Vivo</Text>
            </TouchableOpacity>

            <View style={styles.versionInfo}>
              <Text style={styles.versionText}>Versión 1.0.0</Text>
              <Text style={styles.versionText}>© 2025 WorkingGo</Text>
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* About Us Modal */}
      <Modal
        visible={aboutModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Acerca de Nosotros</Text>
            <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>🚀 WorkingGo</Text>
              <Text style={styles.aboutText}>
                WorkingGo es una plataforma creada por dos estudiantes de ingenieria,
                donde queremos ayudar a personas que tienen algun servicio, ofrecerlo y hacerlo llegar a mas publico.
                Nuestra misión es simplificar la búsqueda de servicios profesionales de 
                calidad y ayudar a los trabajadores a hacer crecer su negocio.
              </Text>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>🎯 Nuestra Misión</Text>
              <Text style={styles.aboutText}>
                Crear un ecosistema confiable donde clientes y profesionales 
                puedan conectarse de manera segura, eficiente y transparente. 
                Facilitamos el acceso a servicios de calidad mientras 
                empoderamos a los trabajadores con herramientas para 
                administrar y expandir sus negocios o empezarlos.
              </Text>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>💡 ¿Qué nos hace diferentes?</Text>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureBold}>Verificación de Profesionales:</Text> Todos 
                  nuestros trabajadores pasan por un proceso de validación.
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureBold}>Sistema de Reseñas Transparente:</Text> Lee 
                  opiniones reales de clientes anteriores.
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureBold}>Comunicación Directa:</Text> Chatea 
                  directamente con los 
                  profesionales antes de contratar.
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureIcon}>✓</Text>
                <Text style={styles.featureText}>
                  <Text style={styles.featureBold}>Amplia Variedad de Servicios:</Text> Desde 
                  plomería hasta desarrollo web, encuentra lo que necesitas.
                </Text>
              </View>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>Y TENEMOS UNA BUENA NOTICIA...</Text>
              
              <View style={styles.promoBox}>
                <Text style={styles.promoTitle}>🎁 ¡Oferta de Lanzamiento!</Text>
                <Text style={styles.promoText}>
                  Si estas buscando ofrecer servicios, el <Text style={styles.promoBold}>primer mes es 
                  completamente GRATIS</Text>. Queremos ayudarte a crecer tu negocio sin costos iniciales.
                </Text>
                <Text style={styles.promoSubtext}>
                  En el futuro implementaremos planes accesibles (mensuales o por comisión), 
                  pero ahora estamos enfocados en construir una comunidad sólida de profesionales 
                  y clientes. ¡Únete hoy y sé parte de WorkingGo desde el inicio!
                </Text>
              </View>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>📞 Contáctanos</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactItem}>📧 Email: info@workinggo.com</Text>
                <Text style={styles.contactItem}>📱 Teléfono: 1-800-WORKER-1</Text>
                <Text style={styles.contactItem}>🌐 Web: www.workinggo.com</Text>
              </View>
            </View>

            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>🌟 Únete a WorkingGo</Text>
              <Text style={styles.aboutText}>
                Ya seas un profesional buscando expandir tu negocio,
                recien empezando uno o un 
                cliente en busca de servicios, WorkingGo es tu 
                plataforma ideal. ¡Comienza hoy GRATIS!
              </Text>
            </View>

            <View style={styles.versionInfo}>
              <Text style={styles.versionText}>Versión 1.0.0</Text>
              <Text style={styles.versionText}>© 2025 WorkingGo. Todos los derechos reservados.</Text>
            </View>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#1e3a5f',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e3a5f',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  menuItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#fee',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#c00',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#1e3a5f',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
  modalContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 16,
  },
  sectionTitleMargin: {
    marginTop: 32,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    maxWidth: '80%',
  },
  dangerButton: {
    backgroundColor: '#fee',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#fdd',
  },
  ratingCard: {
    backgroundColor: '#f0f4f8',
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e0e8f0',
  },
  ratingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginRight: 8,
  },
  ratingCount: {
    fontSize: 14,
    color: '#666',
  },
  dangerButtonText: {
    color: '#c00',
    fontSize: 16,
    fontWeight: '600',
  },
  helpItem: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  helpQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a5f',
    marginBottom: 8,
  },
  helpAnswer: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  contactButton: {
    backgroundColor: '#1e3a5f',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  versionInfo: {
    marginTop: 32,
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  aboutSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  aboutTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 12,
    textAlign: 'center',
  },
  aboutText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  featureItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  featureIcon: {
    fontSize: 20,
    color: '#4CAF50',
    marginRight: 12,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  featureBold: {
    fontWeight: '600',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a5f',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  contactInfo: {
    marginTop: 8,
  },
  contactItem: {
    fontSize: 15,
    color: '#666',
    marginBottom: 12,
    lineHeight: 22,
  },
  promoBox: {
    backgroundColor: '#e8f5e9',
    padding: 20,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  promoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
    textAlign: 'center',
  },
  promoText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  promoBold: {
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  promoSubtext: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});