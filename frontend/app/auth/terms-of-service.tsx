import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { theme } from '../../constants/theme';

export default function TermsOfService() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={{ fontSize: 24 }}>
            ←
          </Text>
        </TouchableOpacity>
        <Text style={styles.title}>Términos de Servicio</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
        <Text style={styles.sectionTitle}>1. Aceptación de Términos</Text>
        <Text style={styles.paragraph}>
          Al utilizar WorkingGo, aceptas estos términos y condiciones. Si no estás de acuerdo, no uses la plataforma.
        </Text>

        <Text style={styles.sectionTitle}>2. Descripción del Servicio</Text>
        <Text style={styles.paragraph}>
          WorkingGo es una plataforma que conecta a clientes con profesionales independientes. Facilitamos la comunicación y coordinación de servicios, pero no somos responsables de la ejecución del trabajo.
        </Text>

        <Text style={styles.sectionTitle}>3. Responsabilidad del Usuario sobre Servicios Publicados</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Responsabilidad Exclusiva del Publicador:</Text>
          {'\n'}• Cada usuario que publica un trabajo o servicio es <Text style={styles.bold}>única y exclusivamente responsable</Text> por su contenido y legalidad.{'\n'}
          • El usuario confirma que todos los servicios que ofrece son <Text style={styles.bold}>completamente legales</Text> en su jurisdicción.{'\n'}
          • El usuario es responsable de cumplir con todas las leyes, regulaciones y requisitos profesionales aplicables a su servicio.{'\n'}
          • WorkingGo <Text style={styles.bold}>NO verifica, valida ni se responsabiliza</Text> por la legalidad o cumplimiento de los servicios publicados.
        </Text>

        <Text style={styles.sectionTitle}>4. Servicios Prohibidos</Text>
        <Text style={styles.paragraph}>
          Los siguientes servicios están <Text style={styles.bold}>estrictamente prohibidos</Text> en WorkingGo:{'\n\n'}
          • Servicios ilegales o que violen leyes nacionales/internacionales{'\n'}
          • Tráfico de drogas, armas u otros artículos ilícitos{'\n'}
          • Explotación sexual o servicios de naturaleza sexual{'\n'}
          • Fraude, estafas o engaños{'\n'}
          • Lavado de dinero o blanqueo de capitales{'\n'}
          • Servicios que requieren licencias profesionales sin poseerlas{'\n'}
          • Cualquier actividad que viole derechos humanos{'\n'}
          • Acoso, difamación o discriminación{'\n'}
          • Venta de datos personales sin consentimiento{'\n'}
          • Cualquier otro servicio que WorkingGo determine como ilegítimo
        </Text>

        <Text style={styles.sectionTitle}>5. Renuncia de Responsabilidad</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>WorkingGo NO es responsable por:</Text>
          {'\n'}• Servicios ilegales o fraudulentos publicados por usuarios{'\n'}
          • Incumplimiento de leyes o regulaciones por parte del proveedor{'\n'}
          • Calidad, completitud o legalidad de los servicios ofrecidos{'\n'}
          • Incumplimiento de acuerdos entre partes{'\n'}
          • Daños derivados de servicios ilegales o fraudulentos{'\n'}
          • Cualquier consecuencia legal derivada del incumplimiento de términos
        </Text>

        <Text style={styles.sectionTitle}>6. Derechos de WorkingGo</Text>
        <Text style={styles.paragraph}>
          WorkingGo se reserva el derecho de:{'\n'}
          • Eliminar contenido que viole estos términos{'\n'}
          • Suspender o cancelar cuentas de usuarios infractores{'\n'}
          • Reportar actividades ilícitas a autoridades competentes{'\n'}
          • Modificar estos términos en cualquier momento{'\n'}
          • Rechazar servicio a usuarios sin previo aviso
        </Text>

        <Text style={styles.sectionTitle}>7. Verificación Legal</Text>
        <Text style={styles.paragraph}>
          Al publicar un servicio, el usuario confirma que:{'\n'}
          • Posee todas las licencias y certificaciones requeridas{'\n'}
          • Cumple con regulaciones profesionales y laborales{'\n'}
          • Ha realizado investigación legal sobre los requisitos aplicables{'\n'}
          • Asume <Text style={styles.bold}>toda responsabilidad legal</Text> por el contenido publicado
        </Text>

        <Text style={styles.sectionTitle}>8. Contacto y Reporte</Text>
        <Text style={styles.paragraph}>
          Si identificas un servicio ilegal o fraudulento, reportalo inmediatamente a:{'\n'}
          Email: soporte@workinggo.com{'\n'}
          Nos comprometeemos a investigar y tomar medidas dentro de 48 horas.
        </Text>

        <Text style={styles.sectionTitle}>9. Cambios en los Términos</Text>
        <Text style={styles.paragraph}>
          Estos términos pueden ser modificados en cualquier momento. El uso continuado de la plataforma implica aceptación de los cambios.
        </Text>

        <Text style={styles.highlight}>
          Al usar WorkingGo, reconoces haber leído, entendido y estar de acuerdo con estos Términos de Servicio en su totalidad.
        </Text>

        <Text style={styles.lastUpdate}>
          Última actualización: Diciembre 2025
        </Text>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e6ed',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.text,
    marginBottom: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  highlight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
    marginBottom: 12,
    overflow: 'hidden',
    lineHeight: 22,
  },
  lastUpdate: {
    fontSize: 12,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 20,
  },
});
