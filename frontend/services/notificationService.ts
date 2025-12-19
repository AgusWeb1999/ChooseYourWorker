// Notification service for handling in-app and email notifications
// This service structures notifications for integration with email services (SendGrid, Resend, etc.)

export type NotificationType = 
  | 'solicitud_enviada'      // When client sends hire request to professional
  | 'solicitud_aceptada'     // When professional accepts hire request
  | 'solicitud_rechazada'    // When professional rejects hire request
  | 'trabajo_completado'     // When professional requests work completion
  | 'aprobacion_completado'  // When client approves work completion
  | 'mensaje_nuevo'          // When there's a new message in chat
  | 'contacto_compartido';   // When contact info is shared

export interface Notification {
  id: string;
  type: NotificationType;
  userId: string;              // Recipient user ID
  senderId: string;            // User who triggered the notification
  senderName: string;
  title: string;
  message: string;
  relatedId?: string;          // Job ID, hiring ID, or message ID
  relatedType?: string;        // 'job', 'hiring', 'message'
  timestamp: Date;
  read: boolean;
  actionUrl?: string;          // Deep link to related content
  email?: string;              // Email address for email notification
}

export interface EmailNotification extends Notification {
  email: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  buttonUrl?: string;
  buttonText?: string;
}

// Create notification object
export function createNotification(
  type: NotificationType,
  userId: string,
  senderId: string,
  senderName: string,
  title: string,
  message: string,
  relatedId?: string,
  relatedType?: string
): Notification {
  return {
    id: `notif_${Date.now()}_${Math.random()}`,
    type,
    userId,
    senderId,
    senderName,
    title,
    message,
    relatedId,
    relatedType,
    timestamp: new Date(),
    read: false,
  };
}

// Create email notification with HTML content
export function createEmailNotification(
  notification: Notification,
  email: string,
  subject: string,
  htmlContent: string,
  textContent: string,
  buttonUrl?: string,
  buttonText?: string
): EmailNotification {
  return {
    ...notification,
    email,
    subject,
    htmlContent,
    textContent,
    buttonUrl,
    buttonText,
  };
}

// Template functions for different notification types

export const notificationTemplates = {
  solicitudEnviada: (senderName: string, jobTitle?: string) => ({
    title: `Nueva solicitud de ${senderName}`,
    message: `${senderName} te envió una solicitud para ${jobTitle || 'un trabajo'}. Revisa el mensaje y acepta si estás interesado.`,
    subject: `Solicitud de contratación de ${senderName}`,
  }),

  solicitudAceptada: (senderName: string) => ({
    title: `${senderName} aceptó tu solicitud`,
    message: `${senderName} ha aceptado tu solicitud. Pronto compartirán datos de contacto para coordinarse.`,
    subject: `Solicitud aceptada por ${senderName}`,
  }),

  solicitudRechazada: (senderName: string) => ({
    title: `${senderName} rechazó tu solicitud`,
    message: `${senderName} no pudo aceptar tu solicitud. Prueba con otro profesional.`,
    subject: `Solicitud rechazada por ${senderName}`,
  }),

  trabajoCompletado: (senderName: string) => ({
    title: `${senderName} solicitó marcar como completado`,
    message: `${senderName} considera que el trabajo está completo. Revisa y aprueba si todo está en orden.`,
    subject: `Solicitud de finalización de ${senderName}`,
  }),

  aprobacionCompletado: (senderName: string) => ({
    title: `${senderName} aprobó la finalización`,
    message: `${senderName} marcó el trabajo como completado. El contrato ha finalizado exitosamente.`,
    subject: `Trabajo completado por ${senderName}`,
  }),

  mensajeNuevo: (senderName: string) => ({
    title: `Mensaje de ${senderName}`,
    message: `${senderName} te envió un mensaje. Abre la app para responder.`,
    subject: `Nuevo mensaje de ${senderName}`,
  }),

  contactoCompartido: (senderName: string) => ({
    title: `Datos de contacto de ${senderName}`,
    message: `Ahora puedes ver los datos de contacto de ${senderName} para coordinarte directamente.`,
    subject: `Datos de contacto de ${senderName}`,
  }),
};

// Generate HTML email content
export function generateEmailHTML(
  title: string,
  message: string,
  buttonUrl?: string,
  buttonText?: string,
  recipientName?: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f9fafb;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 30px 20px;
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
      color: #1f2937;
    }
    .message {
      font-size: 15px;
      line-height: 1.8;
      margin-bottom: 30px;
      color: #4b5563;
    }
    .button {
      display: inline-block;
      background-color: #6366f1;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      text-align: center;
      margin-bottom: 30px;
    }
    .footer {
      background-color: #f3f4f6;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .divider {
      height: 1px;
      background-color: #e5e7eb;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>WorkingGo</h1>
    </div>
    
    <div class="content">
      <div class="greeting">
        ${recipientName ? `Hola ${recipientName},` : 'Hola,'}
      </div>
      
      <div class="message">
        <strong>${title}</strong>
        <div class="divider"></div>
        ${message}
      </div>
      
      ${buttonUrl && buttonText ? `<a href="${buttonUrl}" class="button">${buttonText}</a>` : ''}
      
      <div style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        <p>Si tienes problemas, copia y pega este link en tu navegador:</p>
        <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 6px;">
          ${buttonUrl || 'workinggo.app'}
        </p>
      </div>
    </div>
    
    <div class="footer">
      <p>© 2024 WorkingGo. Todos los derechos reservados.</p>
      <p>Este es un mensaje automático. Por favor no respondas a este email.</p>
    </div>
  </div>
</body>
</html>
  `;
}

// TODO: Implement actual notification sending
// This function should integrate with:
// 1. Supabase real-time for in-app notifications
// 2. Email service (SendGrid, Resend, etc.) for email notifications
// 3. Push notifications (Expo Push Notifications)

export async function sendNotification(notification: Notification): Promise<void> {
  try {
    // TODO: Send to Supabase notifications table
    console.log('Sending in-app notification:', notification);
    
    // TODO: Store in local state for real-time updates
    // Emit event to listeners
    
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

export async function sendEmailNotification(emailNotification: EmailNotification): Promise<void> {
  try {
    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    console.log('Sending email notification:', emailNotification);
    
    // Example integration point:
    // const response = await fetch('/api/send-email', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     to: emailNotification.email,
    //     subject: emailNotification.subject,
    //     html: emailNotification.htmlContent,
    //     text: emailNotification.textContent,
    //   }),
    // });
    
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

export async function sendPushNotification(
  deviceToken: string,
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    // TODO: Integrate with Expo Push Notifications
    console.log('Sending push notification:', { deviceToken, title, message, data });
    
    // Example integration:
    // const response = await fetch('https://exp.host/--/api/v2/push/send', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     to: deviceToken,
    //     title,
    //     body: message,
    //     data,
    //   }),
    // });
    
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}
