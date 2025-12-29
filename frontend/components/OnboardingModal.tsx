import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';

interface Step {
  title: string;
  description: string;
  image?: any;
}

interface OnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  isProfessional: boolean;
}

const stepsClient: Step[] = [
  {
    title: '¡Bienvenido a WorkingGo!',
    description: 'Aquí puedes encontrar profesionales para cualquier tarea que necesites.',
    image: require('../assets/onboarding/client-1.png'),
  },
  {
    title: 'Buscar profesionales',
    description: 'Usa la barra de búsqueda y los filtros para encontrar el trabajador ideal por ubicación y profesión.',
    image: require('../assets/onboarding/client-2.png'),
  },
  {
    title: 'Ver perfiles y enviar propuesta',
    description: 'Explora el perfil, revisa experiencia y opiniones, y envía tu propuesta de trabajo.',
    image: require('../assets/onboarding/client-3.png'),
  },
  {
    title: 'Gestiona tus contrataciones',
    description: 'Recibe notificaciones cuando acepten tu propuesta y haz seguimiento desde la sección "Mis Contrataciones".',
    image: require('../assets/onboarding/client-4.png'),
  },
];

const stepsProfessional: Step[] = [
  {
    title: '¡Bienvenido a WorkingGo!',
    description: 'Aquí puedes ofrecer tus servicios y conseguir nuevos clientes.',
    image: require('../assets/onboarding/prof-1.png'),
  },
  {
    title: 'Completa tu perfil y portafolio',
    description: 'Agrega tu experiencia, tarifas y sube fotos de tus trabajos para destacar.',
    image: require('../assets/onboarding/prof-2.png'),
  },
  {
    title: 'Recibe y acepta propuestas',
    description: 'Te avisaremos cuando un cliente te envíe una propuesta. Puedes aceptarla o rechazarla.',
    image: require('../assets/onboarding/prof-3.png'),
  },
  {
    title: 'Solicita cerrar trabajos',
    description: 'Cuando termines un trabajo, solicita al cliente que lo cierre y deja tu reseña.',
    image: require('../assets/onboarding/prof-4.png'),
  },
];

export default function OnboardingModal({ visible, onClose, isProfessional }: OnboardingModalProps) {
  const steps = isProfessional ? stepsProfessional : stepsClient;
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onClose();
  };
  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };
  const handleClose = () => {
    setStep(0);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView contentContainerStyle={styles.content}>
            {steps[step].image && (
              <Image source={steps[step].image} style={styles.image} resizeMode="contain" />
            )}
            <Text style={styles.title}>{steps[step].title}</Text>
            <Text style={styles.description}>{steps[step].description}</Text>
          </ScrollView>
          <View style={styles.footer}>
            {step > 0 && (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backText}>Atrás</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
              <Text style={styles.nextText}>{step === steps.length - 1 ? 'Finalizar' : 'Siguiente'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    elevation: 10,
    position: 'relative',
  },
  content: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  image: {
    width: '100%',
    height: 420,
    marginBottom: 18,
    borderRadius: 0,
    backgroundColor: '#fff',
    overflow: 'hidden',
    alignSelf: 'center',
    resizeMode: 'cover',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#1e3a5f',
  },
  description: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  backButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    flex: 1,
  },
  nextButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#1e3a5f',
    flex: 1,
  },
  backText: {
    color: '#1e3a5f',
    fontWeight: '600',
    textAlign: 'center',
  },
  nextText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: '#6b7280',
  },
});
