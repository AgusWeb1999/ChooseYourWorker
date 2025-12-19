import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

export default function TermsAndConditions() {
  const router = useRouter();
  const { provider } = useLocalSearchParams();

  const isMercadoPago = provider === 'mercadopago';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Términos y Condiciones</Text>
        <TouchableOpacity onPress={() => router.push('/' as any)} style={[styles.backButton, { left: 'auto', right: 16 }] }>
          <Ionicons name="home" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.providerBadge}>
          <Ionicons 
            name={isMercadoPago ? 'card' : 'logo-paypal'} 
            size={32} 
            color={theme.colors.primary} 
          />
          <Text style={styles.providerName}>
            {isMercadoPago ? 'Mercado Pago' : 'PayPal'}
          </Text>
        </View>

        {isMercadoPago ? (
          <>
            <Text style={styles.sectionTitle}>Términos del Servicio - Mercado Pago</Text>
            
            <Text style={styles.paragraph}>
              Al realizar un pago a través de Mercado Pago para la suscripción premium de WorkingGo, 
              aceptas los siguientes términos y condiciones:
            </Text>

            <Text style={styles.subtitle}>1. Descripción del Servicio</Text>
            <Text style={styles.paragraph}>
              • La suscripción premium tiene un costo de USD $7.99 (dólares estadounidenses) por mes.{'\n'}
              • El cargo se realizará de forma mensual desde la fecha de contratación.{'\n'}
              • La suscripción se renovará automáticamente cada mes.
            </Text>

            <Text style={styles.subtitle}>2. Proceso de Pago</Text>
            <Text style={styles.paragraph}>
              • Los pagos se procesan de forma segura a través de Mercado Pago.{'\n'}
              • Aceptamos tarjetas de crédito, débito y otros medios de pago disponibles en Mercado Pago.{'\n'}
              • El cargo aparecerá en tu resumen como "WorkingGo".{'\n'}
              • Recibirás un comprobante de pago por email una vez confirmada la transacción.
            </Text>

            <Text style={styles.subtitle}>3. Renovación y Cancelación</Text>
            <Text style={styles.paragraph}>
              • La suscripción se renueva automáticamente cada mes.{'\n'}
              • Puedes cancelar tu suscripción en cualquier momento desde tu perfil.{'\n'}
              • Al cancelar, mantendrás acceso premium hasta el final del período pagado.{'\n'}
              • No se realizan reembolsos por días no utilizados dentro del mes.
            </Text>

            <Text style={styles.subtitle}>4. Política de Reembolsos</Text>
            <Text style={styles.paragraph}>
              • No ofrecemos reembolsos por cancelaciones voluntarias.{'\n'}
              • En caso de cargos duplicados o errores del sistema, contacta nuestro soporte.{'\n'}
              • Los reembolsos por errores se procesarán en 5-10 días hábiles.
            </Text>

            <Text style={styles.subtitle}>5. Modificaciones del Precio</Text>
            <Text style={styles.paragraph}>
              • Nos reservamos el derecho de modificar el precio de la suscripción.{'\n'}
              • Te notificaremos con 30 días de anticipación sobre cualquier cambio de precio.{'\n'}
              • Los cambios de precio no afectarán tu ciclo de facturación actual.
            </Text>

            <Text style={styles.subtitle}>6. Seguridad</Text>
            <Text style={styles.paragraph}>
              • Tus datos de pago son procesados de forma segura por Mercado Pago.{'\n'}
              • No almacenamos información de tarjetas de crédito en nuestros servidores.{'\n'}
              • Todas las transacciones están encriptadas con SSL.
            </Text>

            <Text style={styles.subtitle}>7. Condiciones de Uso de Mercado Pago</Text>
            <Text style={styles.paragraph}>
              Al utilizar Mercado Pago, también aceptas sus términos y condiciones:{'\n'}
              • Términos y Condiciones de Mercado Pago: https://www.mercadopago.com.ar/ayuda/terminos-y-condiciones_299{'\n'}
              • Política de Privacidad de Mercado Pago: https://www.mercadopago.com.ar/privacidad
            </Text>

            <Text style={styles.subtitle}>8. Contacto y Soporte</Text>
            <Text style={styles.paragraph}>
              Para consultas sobre tu suscripción o problemas con pagos:{'\n'}
              • Email: soporte@workinggo.com{'\n'}
              • Tiempo de respuesta: 24-48 horas
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Términos del Servicio - PayPal</Text>
            
            <Text style={styles.paragraph}>
              Al realizar un pago a través de PayPal para la suscripción premium de WorkingGo, 
              aceptas los siguientes términos y condiciones:
            </Text>

            <Text style={styles.subtitle}>1. Descripción del Servicio</Text>
            <Text style={styles.paragraph}>
              • La suscripción premium tiene un costo de USD $7.99 (dólares estadounidenses) por mes.{'\n'}
              • El cargo se realizará de forma mensual desde la fecha de contratación.{'\n'}
              • La suscripción se renovará automáticamente cada mes.
            </Text>

            <Text style={styles.subtitle}>2. Proceso de Pago</Text>
            <Text style={styles.paragraph}>
              • Los pagos se procesan de forma segura a través de PayPal.{'\n'}
              • Puedes pagar con tu saldo de PayPal, tarjetas vinculadas o cuenta bancaria.{'\n'}
              • El cargo aparecerá en tu estado de cuenta como "WorkingGo".{'\n'}
              • Recibirás un comprobante de pago por email una vez confirmada la transacción.
            </Text>

            <Text style={styles.subtitle}>3. Renovación y Cancelación</Text>
            <Text style={styles.paragraph}>
              • La suscripción se renueva automáticamente cada mes.{'\n'}
              • Puedes cancelar tu suscripción en cualquier momento desde tu perfil.{'\n'}
              • Al cancelar, mantendrás acceso premium hasta el final del período pagado.{'\n'}
              • No se realizan reembolsos por días no utilizados dentro del mes.
            </Text>

            <Text style={styles.subtitle}>4. Política de Reembolsos</Text>
            <Text style={styles.paragraph}>
              • No ofrecemos reembolsos por cancelaciones voluntarias.{'\n'}
              • En caso de cargos duplicados o errores del sistema, contacta nuestro soporte.{'\n'}
              • Los reembolsos por errores se procesarán en 5-10 días hábiles.{'\n'}
              • Los reembolsos se acreditarán en tu cuenta de PayPal.
            </Text>

            <Text style={styles.subtitle}>5. Protección al Comprador de PayPal</Text>
            <Text style={styles.paragraph}>
              • Estás protegido por la Protección al Comprador de PayPal.{'\n'}
              • Puedes disputar cargos no autorizados directamente en PayPal.{'\n'}
              • PayPal actuará como mediador en caso de disputas.
            </Text>

            <Text style={styles.subtitle}>6. Modificaciones del Precio</Text>
            <Text style={styles.paragraph}>
              • Nos reservamos el derecho de modificar el precio de la suscripción.{'\n'}
              • Te notificaremos con 30 días de anticipación sobre cualquier cambio de precio.{'\n'}
              • Los cambios de precio no afectarán tu ciclo de facturación actual.
            </Text>

            <Text style={styles.subtitle}>7. Seguridad</Text>
            <Text style={styles.paragraph}>
              • Tus datos de pago son procesados de forma segura por PayPal.{'\n'}
              • No almacenamos información de tarjetas o cuentas bancarias en nuestros servidores.{'\n'}
              • Todas las transacciones están encriptadas con tecnología de seguridad de PayPal.
            </Text>

            <Text style={styles.subtitle}>8. Conversión de Moneda</Text>
            <Text style={styles.paragraph}>
              • Si tu cuenta de PayPal está en una moneda diferente a USD, se aplicará conversión.{'\n'}
              • Las tasas de conversión son establecidas por PayPal.{'\n'}
              • Pueden aplicarse comisiones adicionales por conversión de moneda.
            </Text>

            <Text style={styles.subtitle}>9. Condiciones de Uso de PayPal</Text>
            <Text style={styles.paragraph}>
              Al utilizar PayPal, también aceptas sus términos y condiciones:{'\n'}
              • Acuerdo de Usuario de PayPal: https://www.paypal.com/ar/webapps/mpp/ua/useragreement-full{'\n'}
              • Política de Privacidad de PayPal: https://www.paypal.com/ar/webapps/mpp/ua/privacy-full
            </Text>

            <Text style={styles.subtitle}>10. Contacto y Soporte</Text>
            <Text style={styles.paragraph}>
              Para consultas sobre tu suscripción o problemas con pagos:{'\n'}
              • Email: soporte@workinggo.com{'\n'}
              • Tiempo de respuesta: 24-48 horas
            </Text>
          </>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Última actualización: Noviembre 2025
          </Text>
          <Text style={styles.footerText}>
            WorkingGo © 2025. Todos los derechos reservados.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.acceptButton}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Entendido</Text>
        </TouchableOpacity>
      </View>
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
    borderBottomColor: theme.colors.border || '#E5E5E5',
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
    padding: 20,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    marginBottom: 24,
  },
  providerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 22,
    marginBottom: 12,
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border || '#E5E5E5',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  acceptButton: {
    padding: 16,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border || '#E5E5E5',
  },
  button: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
