// Supabase Edge Function para enviar emails con Resend
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'WorkingGo <notificaciones@workinggo.com>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, prefer',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

interface EmailRequest {
  type: 'new_message' | 'new_proposal' | 'proposal_confirmation' | 'proposal_accepted' | 'completion_requested' | 'work_completed' | 'new_review' | 'guest_contact' | 'completion_requested_guest';
  hireId?: string;
  conversationId?: string;
  userId?: string;
  senderId?: string;
  reviewId?: string;
  frontendUrl?: string;
}

// Plantilla de email para nuevo mensaje
function getNewMessageTemplate(userName: string, senderName: string, messagePreview: string, loginUrl: string) {
  return {
    subject: `Nuevo mensaje de ${senderName} en WorkingGo`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Nuevo mensaje</title></head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;">
              <tr><td style="background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);padding:40px 30px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:32px;font-weight:700;">💬 WorkingGo</h1>
              </td></tr>
              <tr><td style="padding:40px 30px;">
                <h2 style="color:#1e293b;margin:0 0 20px 0;font-size:24px;font-weight:600;">¡Hola ${userName}!</h2>
                <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 20px 0;">
                  <strong style="color:#1e3a5f;">${senderName}</strong> te ha enviado un nuevo mensaje:
                </p>
                <div style="background-color:#f8fafc;border-left:4px solid #2563eb;padding:20px;margin:0 0 30px 0;border-radius:8px;">
                  <p style="color:#475569;font-size:15px;line-height:1.6;margin:0;">${messagePreview}</p>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td align="center" style="padding:20px 0;">
                    <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 100%);color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(30,58,95,0.3);">Ver mensaje</a>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="background-color:#f8fafc;padding:30px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="color:#64748b;font-size:12px;margin:0;">© ${new Date().getFullYear()} WorkingGo. Todos los derechos reservados.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };
}

// Plantilla de email para nueva propuesta
function getNewProposalTemplate(professionalName: string, clientName: string, proposalMessage: string, loginUrl: string) {
  return {
    subject: '🎯 Nueva propuesta de trabajo en WorkingGo',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Nueva Propuesta</title></head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;">
              <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px 30px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:32px;font-weight:700;">🎯 WorkingGo</h1>
              </td></tr>
              <tr><td style="padding:40px 30px;">
                <h2 style="color:#1e293b;margin:0 0 20px 0;font-size:24px;font-weight:600;">¡Hola ${professionalName}!</h2>
                <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 20px 0;">
                  Tienes una <strong style="color:#10b981;">nueva propuesta de trabajo</strong> de <strong>${clientName}</strong>.
                </p>
                ${proposalMessage ? `
                  <div style="background-color:#e0e7ff;border-left:4px solid #6366f1;padding:20px;border-radius:8px;margin:20px 0;">
                    <p style="color:#475569;font-size:14px;font-weight:600;margin:0 0 10px 0;">Mensaje del cliente:</p>
                    <p style="color:#1e293b;font-size:15px;line-height:1.6;margin:0;font-style:italic;">"${proposalMessage}"</p>
                  </div>
                ` : ''}
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td align="center" style="padding:20px 0;">
                    <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(16,185,129,0.3);">Ver propuesta</a>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="background-color:#f8fafc;padding:30px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="color:#64748b;font-size:12px;margin:0;">© ${new Date().getFullYear()} WorkingGo. Todos los derechos reservados.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };
}

// Plantilla de email para confirmación de propuesta enviada (al cliente)
function getProposalConfirmationTemplate(clientName: string, professionalName: string, proposalMessage: string) {
  return {
    subject: '✅ Tu propuesta ha sido enviada - WorkingGo',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Propuesta Enviada</title></head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;">
              <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#4f46e5 100%);padding:40px 30px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:32px;font-weight:700;">✅ WorkingGo</h1>
              </td></tr>
              <tr><td style="padding:40px 30px;">
                <h2 style="color:#1e293b;margin:0 0 20px 0;font-size:24px;font-weight:600;">¡Hola ${clientName}!</h2>
                <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 20px 0;">
                  Tu propuesta de trabajo ha sido enviada exitosamente a <strong style="color:#6366f1;">${professionalName}</strong>.
                </p>
                <div style="background-color:#f0fdf4;border-left:4px solid#10b981;padding:20px;border-radius:8px;margin:20px 0;">
                  <p style="color:#059669;font-size:14px;font-weight:600;margin:0 0 10px 0;">✓ Propuesta enviada</p>
                  <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">
                    ${professionalName} recibirá una notificación y podrá aceptar o rechazar tu propuesta. Te avisaremos cuando haya una respuesta.
                  </p>
                </div>
                ${proposalMessage ? `
                  <div style="background-color:#f8fafc;padding:20px;border-radius:8px;margin:20px 0;">
                    <p style="color:#64748b;font-size:14px;font-weight:600;margin:0 0 10px 0;">Tu mensaje:</p>
                    <p style="color:#1e293b;font-size:15px;line-height:1.6;margin:0;font-style:italic;">"${proposalMessage}"</p>
                  </div>
                ` : ''}
              </td></tr>
              <tr><td style="background-color:#f8fafc;padding:30px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="color:#64748b;font-size:12px;margin:0;">© ${new Date().getFullYear()} WorkingGo. Todos los derechos reservados.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };
}

// Plantilla para cuando el trabajador acepta la propuesta
function getProposalAcceptedTemplate(clientName: string, professionalName: string, professionalPhone: string, loginUrl: string) {
  return {
    subject: '🎉 Tu propuesta fue aceptada - WorkingGo',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Propuesta Aceptada</title></head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;">
              <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px 30px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:32px;font-weight:700;">🎉 WorkingGo</h1>
              </td></tr>
              <tr><td style="padding:40px 30px;">
                <h2 style="color:#1e293b;margin:0 0 20px 0;font-size:24px;font-weight:600;">¡Excelente noticia, ${clientName}!</h2>
                <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 20px 0;">
                  <strong style="color:#10b981;">${professionalName}</strong> ha aceptado tu propuesta de trabajo.
                </p>
                <div style="background-color:#f0fdf4;border:2px solid #10b981;padding:25px;border-radius:12px;margin:20px 0;">
                  <p style="color:#059669;font-size:16px;font-weight:700;margin:0 0 15px 0;">📞 Información de contacto:</p>
                  <p style="color:#1e293b;font-size:15px;line-height:1.8;margin:0;">
                    <strong>Teléfono:</strong> ${professionalPhone}<br/>
                    Puedes contactar directamente a ${professionalName} para coordinar los detalles del trabajo.
                  </p>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td align="center" style="padding:20px 0;">
                    <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(16,185,129,0.3);">Ver detalles</a>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="background-color:#f8fafc;padding:30px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="color:#64748b;font-size:12px;margin:0;">© ${new Date().getFullYear()} WorkingGo. Todos los derechos reservados.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };
}

// Plantilla para cuando el trabajador solicita finalizar el trabajo
function getCompletionRequestedTemplate(clientName: string, professionalName: string, loginUrl: string) {
  return {
    subject: '⏰ Solicitud de finalización de trabajo - WorkingGo',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Solicitud de Finalización</title></head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;">
              <tr><td style="background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);padding:40px 30px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:32px;font-weight:700;">⏰ WorkingGo</h1>
              </td></tr>
              <tr><td style="padding:40px 30px;">
                <h2 style="color:#1e293b;margin:0 0 20px 0;font-size:24px;font-weight:600;">¡Hola ${clientName}!</h2>
                <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 20px 0;">
                  <strong style="color:#f59e0b;">${professionalName}</strong> ha solicitado dar por finalizado el trabajo.
                </p>
                <div style="background-color:#fffbeb;border-left:4px solid #f59e0b;padding:20px;border-radius:8px;margin:20px 0;">
                  <p style="color:#d97706;font-size:14px;font-weight:600;margin:0 0 10px 0;">⚠️ Acción requerida</p>
                  <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">
                    Por favor revisa el trabajo realizado y confírma si está completo. Una vez confirmado, podrás dejar una reseña sobre la experiencia.
                  </p>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td align="center" style="padding:20px 0;">
                    <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#f59e0b 0%,#d97706 100%);color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(245,158,11,0.3);">Revisar trabajo</a>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="background-color:#f8fafc;padding:30px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="color:#64748b;font-size:12px;margin:0;">© ${new Date().getFullYear()} WorkingGo. Todos los derechos reservados.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };
}

// Plantilla para cuando el cliente confirma la finalización
function getWorkCompletedTemplate(professionalName: string, clientName: string, loginUrl: string) {
  return {
    subject: '✅ Trabajo completado - WorkingGo',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Trabajo Completado</title></head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;">
              <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px 30px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:32px;font-weight:700;">✅ WorkingGo</h1>
              </td></tr>
              <tr><td style="padding:40px 30px;">
                <h2 style="color:#1e293b;margin:0 0 20px 0;font-size:24px;font-weight:600;">¡Felicitaciones, ${professionalName}!</h2>
                <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 20px 0;">
                  <strong style="color:#10b981;">${clientName}</strong> ha confirmado que el trabajo está completado satisfactoriamente.
                </p>
                <div style="background-color:#f0fdf4;border:2px solid #10b981;padding:25px;border-radius:12px;margin:20px 0;text-align:center;">
                  <p style="color:#059669;font-size:20px;font-weight:700;margin:0 0 10px 0;">🎉 ¡Trabajo finalizado!</p>
                  <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">
                    Este trabajo se suma a tu historial y puede ayudarte a conseguir más clientes.
                  </p>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td align="center" style="padding:20px 0;">
                    <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(16,185,129,0.3);">Ver detalles</a>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="background-color:#f8fafc;padding:30px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="color:#64748b;font-size:12px;margin:0;">© ${new Date().getFullYear()} WorkingGo. Todos los derechos reservados.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };
}

// Plantilla para cuando el cliente deja una reseña
function getNewReviewTemplate(professionalName: string, clientName: string, rating: number, comment: string, loginUrl: string) {
  const stars = '⭐'.repeat(rating);
  return {
    subject: '⭐ Nueva reseña recibida - WorkingGo',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Nueva Reseña</title></head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;">
              <tr><td style="background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%);padding:40px 30px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:32px;font-weight:700;">⭐ WorkingGo</h1>
              </td></tr>
              <tr><td style="padding:40px 30px;">
                <h2 style="color:#1e293b;margin:0 0 20px 0;font-size:24px;font-weight:600;">¡Hola ${professionalName}!</h2>
                <p style="color:#475569;font-size:16px;line-height:1.6;margin:0 0 20px 0;">
                  <strong style="color:#f59e0b;">${clientName}</strong> ha dejado una reseña sobre tu trabajo.
                </p>
                <div style="background-color:#fffbeb;border:2px solid #fbbf24;padding:25px;border-radius:12px;margin:20px 0;">
                  <p style="color:#d97706;font-size:24px;font-weight:700;margin:0 0 15px 0;text-align:center;">${stars}</p>
                  ${comment ? `
                    <p style="color:#1e293b;font-size:15px;line-height:1.6;margin:0;font-style:italic;text-align:center;">"${comment}"</p>
                  ` : ''}
                </div>
                <p style="color:#64748b;font-size:14px;line-height:1.6;margin:20px 0;text-align:center;">
                  Las buenas reseñas ayudan a mejorar tu visibilidad y atraer más clientes en WorkingGo.
                </p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr><td align="center" style="padding:20px 0;">
                    <a href="${loginUrl}" style="display:inline-block;background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%);color:#fff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:600;box-shadow:0 4px 12px rgba(251,191,36,0.3);">Ver reseña</a>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="background-color:#f8fafc;padding:30px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="color:#64748b;font-size:12px;margin:0;">© ${new Date().getFullYear()} WorkingGo. Todos los derechos reservados.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };
}

// Plantilla para cuando un invitado envía solicitud de contacto (correo al profesional)
function getGuestContactWorkerTemplate(
  professionalName: string,
  guestName: string,
  guestEmail: string,
  guestPhone: string,
  serviceCategory?: string,
  serviceDescription?: string,
  serviceLocation?: string,
  baseUrl?: string
) {
  return {
    subject: '🆕 Nueva solicitud de invitado - WorkingGo',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Nuevo contacto</title></head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;">
              <tr><td style="background:linear-gradient(135deg,#0ea5e9 0%,#0284c7 100%);padding:40px 30px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:32px;font-weight:700;">📩 Nueva solicitud</h1>
              </td></tr>
              <tr><td style="padding:32px 28px;">
                <h2 style="color:#0f172a;margin:0 0 16px 0;font-size:22px;font-weight:700;">Hola ${professionalName}!</h2>
                <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 20px 0;">Un cliente invitado quiere contactarte. Aquí tienes sus datos para coordinar:</p>
                <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 16px;margin-bottom:18px;">
                  <p style="color:#0f172a;font-size:15px;line-height:1.8;margin:0;"><strong>Nombre:</strong> ${guestName}</p>
                  <p style="color:#0f172a;font-size:15px;line-height:1.8;margin:0;"><strong>Email:</strong> ${guestEmail}</p>
                  <p style="color:#0f172a;font-size:15px;line-height:1.8;margin:0;"><strong>Teléfono:</strong> ${guestPhone}</p>
                </div>
                <div style="background-color:#ecfeff;border:1px solid #bae6fd;border-radius:12px;padding:18px 16px;">
                  <p style="color:#0369a1;font-size:14px;font-weight:700;margin:0 0 10px 0;">Detalles del servicio</p>
                  ${serviceCategory ? `<p style="color:#0f172a;font-size:15px;line-height:1.6;margin:0;"><strong>Categoría:</strong> ${serviceCategory}</p>` : ''}
                  ${serviceLocation ? `<p style="color:#0f172a;font-size:15px;line-height:1.6;margin:4px 0 0 0;"><strong>Ubicación:</strong> ${serviceLocation}</p>` : ''}
                  ${serviceDescription ? `<p style="color:#0f172a;font-size:15px;line-height:1.6;margin:12px 0 0 0;white-space:pre-line;">${serviceDescription}</p>` : ''}
                </div>
              </td></tr>
              <tr><td style="background-color:#f8fafc;padding:26px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} WorkingGo. Todos los derechos reservados.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };
}

// Plantilla para enviar al invitado con los datos del profesional
function getGuestContactClientTemplate(
  clientName: string,
  professionalName: string,
  professionalPhone: string,
  professionalEmail: string,
  serviceCategory?: string,
  serviceDescription?: string,
  serviceLocation?: string,
  baseUrl?: string,
  reviewToken?: string
) {
  const finalBaseUrl = baseUrl || Deno.env.get('FRONTEND_URL') || 'https://workinggo.com';

  return {
    subject: '📞 Datos de contacto del profesional - WorkingGo',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Contacto del profesional</title></head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;">
              <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px 30px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:32px;font-weight:700;">✅ Profesional aceptado</h1>
              </td></tr>
              <tr><td style="padding:32px 28px;">
                <h2 style="color:#0f172a;margin:0 0 16px 0;font-size:22px;font-weight:700;">Hola ${clientName}!</h2>
                <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 20px 0;">
                  ¡Buenas noticias! <strong style="color:#10b981;">${professionalName}</strong> ha aceptado tu solicitud. Te compartimos sus datos de contacto para que coordinen directamente.
                </p>
                <div style="background-color:#f0fdf4;border:2px solid #10b981;border-radius:12px;padding:20px 18px;margin-bottom:20px;">
                  <p style="color:#0f172a;font-size:16px;line-height:1.8;margin:0 0 8px 0;"><strong>👤 Profesional:</strong> ${professionalName}</p>
                  <p style="color:#0f172a;font-size:16px;line-height:1.8;margin:0 0 8px 0;"><strong>📞 Teléfono:</strong> ${professionalPhone}</p>
                  <p style="color:#0f172a;font-size:16px;line-height:1.8;margin:0;"><strong>✉️ Email:</strong> ${professionalEmail}</p>
                </div>
                <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 16px;margin-bottom:20px;">
                  <p style="color:#0f172a;font-size:15px;line-height:1.6;margin:0 0 10px 0;"><strong>📝 Tu solicitud</strong></p>
                  ${serviceCategory ? `<p style="color:#0f172a;font-size:15px;line-height:1.6;margin:0;"><strong>Categoría:</strong> ${serviceCategory}</p>` : ''}
                  ${serviceLocation ? `<p style="color:#0f172a;font-size:15px;line-height:1.6;margin:4px 0 0 0;"><strong>Ubicación:</strong> ${serviceLocation}</p>` : ''}
                  ${serviceDescription ? `<p style="color:#0f172a;font-size:15px;line-height:1.6;margin:12px 0 0 0;white-space:pre-line;">${serviceDescription}</p>` : ''}
                </div>
                <div style="background-color:#eff6ff;border:1px solid #3b82f6;border-radius:12px;padding:18px;margin-bottom:20px;">
                  <p style="color:#1e40af;font-size:14px;font-weight:600;margin:0 0 8px 0;">💡 Próximos pasos:</p>
                  <p style="color:#1e40af;font-size:14px;line-height:1.6;margin:0;">
                    1. Contacta al profesional por teléfono o email<br>
                    2. Confirma horarios, costo y detalles del trabajo<br>
                    3. Una vez completado el trabajo, recibirás un email para calificar el servicio
                  </p>
                </div>
              </td></tr>
              <tr><td style="background-color:#f8fafc;padding:26px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} WorkingGo. Todos los derechos reservados.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };
}

// Plantilla para notificar al invitado que el profesional solicitó finalización
function getGuestCompletionRequestedTemplate(
  clientName: string,
  professionalName: string,
  serviceCategory?: string,
  serviceDescription?: string,
  reviewUrl?: string
) {
  return {
    subject: '✅ Trabajo completado - Tu calificación es importante',
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Trabajo completado</title></head>
      <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
          <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#fff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.1);overflow:hidden;">
              <tr><td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:40px 30px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:32px;font-weight:700;">✅ Trabajo completado</h1>
              </td></tr>
              <tr><td style="padding:32px 28px;">
                <h2 style="color:#0f172a;margin:0 0 16px 0;font-size:22px;font-weight:700;">Hola ${clientName}!</h2>
                <p style="color:#334155;font-size:16px;line-height:1.6;margin:0 0 20px 0;">
                  <strong style="color:#10b981;">${professionalName}</strong> ha marcado como completado el siguiente trabajo:
                </p>
                ${serviceCategory || serviceDescription ? `
                <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 16px;margin-bottom:24px;">
                  ${serviceCategory ? `<p style="color:#0f172a;font-size:15px;line-height:1.6;margin:0;"><strong>Servicio:</strong> ${serviceCategory}</p>` : ''}
                  ${serviceDescription ? `<p style="color:#0f172a;font-size:15px;line-height:1.6;margin:12px 0 0 0;white-space:pre-line;">${serviceDescription}</p>` : ''}
                </div>` : ''}
                <div style="background-color:#fef3c7;border:2px solid #fbbf24;border-radius:12px;padding:24px;margin-bottom:24px;">
                  <p style="color:#78350f;font-size:16px;font-weight:700;margin:0 0 12px 0;">⭐ Tu calificación es muy importante</p>
                  <p style="color:#78350f;font-size:14px;line-height:1.6;margin:0 0 18px 0;">
                    Ayuda a otros usuarios compartiendo tu experiencia con este profesional. Tu opinión nos ayuda a mantener la calidad del servicio.
                  </p>
                  ${reviewUrl ? `
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr><td align="center">
                      <a href="${reviewUrl}" style="display:inline-block;background:linear-gradient(135deg,#fbbf24 0%,#f59e0b 100%);color:#78350f;text-decoration:none;padding:16px 36px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 12px rgba(251,191,36,0.4);">⭐ Calificar ahora</a>
                    </td></tr>
                  </table>` : ''}
                </div>
                <p style="color:#64748b;font-size:14px;line-height:1.6;margin:0;">
                  Si tienes alguna consulta sobre el trabajo realizado, te recomendamos contactar directamente con el profesional.
                </p>
              </td></tr>
              <tr><td style="background-color:#f8fafc;padding:26px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} WorkingGo. Todos los derechos reservados.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </body>
      </html>
    `,
  };
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, hireId, conversationId, userId, senderId, frontendUrl }: EmailRequest = await req.json();
    const baseUrl = frontendUrl || Deno.env.get('FRONTEND_URL') || 'https://workinggo.com';

    if (type === 'new_proposal' && hireId) {
      // Obtener datos de la propuesta
      const { data: hire, error: hireError } = await supabaseClient
        .from('hires')
        .select('id, proposal_message, client_id, professional_id')
        .eq('id', hireId)
        .single();

      if (hireError || !hire) {
        throw new Error('Hire not found');
      }

      // Obtener cliente
      const { data: client } = await supabaseClient
        .from('users')
        .select('full_name')
        .eq('id', hire.client_id)
        .single();

      // Obtener profesional
      const { data: professional } = await supabaseClient
        .from('professionals')
        .select('user_id, display_name')
        .eq('id', hire.professional_id)
        .single();

      if (!professional?.user_id) {
        throw new Error('Professional not found');
      }

      // Obtener email del profesional
      const { data: professionalUser } = await supabaseClient
        .from('users')
        .select('email')
        .eq('id', professional.user_id)
        .single();

      if (!professionalUser?.email) {
        throw new Error('Professional email not found');
      }

      const loginUrl = `${Deno.env.get('FRONTEND_URL') || 'https://workinggo.com'}/professional`;
      const template = getNewProposalTemplate(
        professional.display_name || 'Profesional',
        client?.full_name || 'Un cliente',
        hire.proposal_message || '',
        loginUrl
      );

        const result = await sendEmail(professionalUser.email, template.subject, template.html);
      
        return jsonResponse({ success: true, data: result });

    } else if (type === 'new_message' && conversationId) {
      // Si no tenemos userId, lo buscamos usando conversation_list view
      let recipientId = userId;
      
      console.log('🔍 Looking for recipient:', { conversationId, senderId, userId });
      
      if (!recipientId && senderId) {
        // Intentar con conversation_list view primero
        const { data: convData, error: convError } = await supabaseClient
          .from('conversation_list')
          .select('other_user_id')
          .eq('conversation_id', conversationId)
          .eq('user_id', senderId)
          .maybeSingle();
        
        console.log('📊 conversation_list query result:', { convData, convError });
        
        if (convData?.other_user_id) {
          recipientId = convData.other_user_id;
        } else {
          // Fallback: buscar directamente en la tabla conversations
          console.log('⚠️ conversation_list failed, trying conversations table...');
          const { data: conv, error: convTableError } = await supabaseClient
            .from('conversations')
            .select('*')
            .eq('id', conversationId)
            .single();
          
          console.log('📋 conversations table result:', { conv, convTableError });
          
          if (conv) {
            // Los campos son participant1_id y participant2_id
            // El destinatario es el participante que NO es el senderId
            if (conv.participant1_id === senderId) {
              recipientId = conv.participant2_id;
              console.log('✅ Recipient is participant2:', recipientId);
            } else if (conv.participant2_id === senderId) {
              recipientId = conv.participant1_id;
              console.log('✅ Recipient is participant1:', recipientId);
            } else {
              console.log('⚠️ Sender not found in conversation participants');
            }
          }
        }
      }
      
      if (!recipientId) {
        console.error('❌ Could not determine recipient after all attempts');
        throw new Error('Could not determine recipient');
      }
      
      console.log('✅ Recipient determined:', recipientId);
      
      // Obtener usuario destinatario
      const { data: user, error: userError } = await supabaseClient
        .from('users')
        .select('email, full_name')
        .eq('id', recipientId)
        .single();

      console.log('👤 Recipient user data:', { user, userError });

      if (!user?.email) {
        throw new Error('User email not found');
      }

      // Obtener el último mensaje de la conversación
      const { data: lastMessage, error: messageError } = await supabaseClient
        .from('messages')
        .select('content, sender_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('💬 Last message data:', { lastMessage, messageError });

      if (!lastMessage) {
        throw new Error('Message not found');
      }

      // Obtener nombre del remitente
      const { data: sender, error: senderError } = await supabaseClient
        .from('users')
        .select('full_name')
        .eq('id', lastMessage.sender_id)
        .single();

      console.log('✉️ Sender data:', { sender, senderError });

      const loginUrl = `${Deno.env.get('FRONTEND_URL') || 'https://workinggo.com'}/messages`;
      const messagePreview = lastMessage.content.length > 150 
        ? lastMessage.content.substring(0, 150) + '...' 
        : lastMessage.content;

      console.log('📧 Preparing email:', {
        to: user.email,
        recipientName: user.full_name,
        senderName: sender?.full_name,
        messagePreview
      });

      const template = getNewMessageTemplate(
        user.full_name || 'Usuario',
        sender?.full_name || 'Un usuario',
        messagePreview,
        loginUrl
      );

      console.log('📮 Sending email via Resend...');
        const result = await sendEmail(user.email, template.subject, template.html);
        console.log('✅ Email sent successfully:', result);
      
        return jsonResponse({ success: true, data: result });

    } else if (type === 'proposal_confirmation' && hireId) {
      // Email de confirmación al cliente cuando envía una propuesta
      const { data: hire } = await supabaseClient
        .from('hires')
        .select('proposal_message, client_id, professional_id')
        .eq('id', hireId)
        .single();

      if (!hire) throw new Error('Hire not found');

      const { data: client } = await supabaseClient
        .from('users')
        .select('email, full_name')
        .eq('id', hire.client_id)
        .single();

      const { data: professional } = await supabaseClient
        .from('professionals')
        .select('display_name')
        .eq('id', hire.professional_id)
        .single();

      if (!client?.email) throw new Error('Client email not found');

      const template = getProposalConfirmationTemplate(
        client.full_name || 'Cliente',
        professional?.display_name || 'Profesional',
        hire.proposal_message || ''
      );

        const result = await sendEmail(client.email, template.subject, template.html);
      
        return jsonResponse({ success: true, data: result });

    } else if (type === 'proposal_accepted' && hireId) {
      // Email al cliente cuando el trabajador acepta la propuesta
      const { data: hire } = await supabaseClient
        .from('hires')
        .select('client_id, professional_id')
        .eq('id', hireId)
        .single();

      if (!hire) throw new Error('Hire not found');

      const { data: client } = await supabaseClient
        .from('users')
        .select('email, full_name')
        .eq('id', hire.client_id)
        .single();

      const { data: professional } = await supabaseClient
        .from('professionals')
        .select('display_name, phone')
        .eq('id', hire.professional_id)
        .single();

      if (!client?.email) throw new Error('Client email not found');

      const loginUrl = `${Deno.env.get('FRONTEND_URL') || 'https://workinggo.com'}/professional/${hire.professional_id}`;
      const template = getProposalAcceptedTemplate(
        client.full_name || 'Cliente',
        professional?.display_name || 'Profesional',
        professional?.phone || 'No disponible',
        loginUrl
      );

        const result = await sendEmail(client.email, template.subject, template.html);
      
        return jsonResponse({ success: true, data: result });

    } else if (type === 'completion_requested' && hireId) {
      // Email al cliente cuando el trabajador solicita finalizar
      const { data: hire } = await supabaseClient
        .from('hires')
        .select('client_id, professional_id')
        .eq('id', hireId)
        .single();

      if (!hire) throw new Error('Hire not found');

      const { data: client } = await supabaseClient
        .from('users')
        .select('email, full_name')
        .eq('id', hire.client_id)
        .single();

      const { data: professional } = await supabaseClient
        .from('professionals')
        .select('display_name')
        .eq('id', hire.professional_id)
        .single();

      if (!client?.email) throw new Error('Client email not found');

      const loginUrl = `${Deno.env.get('FRONTEND_URL') || 'https://workinggo.com'}/professional/${hire.professional_id}`;
      const template = getCompletionRequestedTemplate(
        client.full_name || 'Cliente',
        professional?.display_name || 'Profesional',
        loginUrl
      );

        const result = await sendEmail(client.email, template.subject, template.html);
      
        return jsonResponse({ success: true, data: result });

    } else if (type === 'work_completed' && hireId) {
      // Email al trabajador cuando el cliente confirma la finalización
      const { data: hire } = await supabaseClient
        .from('hires')
        .select('client_id, professional_id')
        .eq('id', hireId)
        .single();

      if (!hire) throw new Error('Hire not found');

      const { data: client } = await supabaseClient
        .from('users')
        .select('full_name')
        .eq('id', hire.client_id)
        .single();

      const { data: professional } = await supabaseClient
        .from('professionals')
        .select('user_id, display_name')
        .eq('id', hire.professional_id)
        .single();

      if (!professional?.user_id) throw new Error('Professional not found');

      const { data: professionalUser } = await supabaseClient
        .from('users')
        .select('email')
        .eq('id', professional.user_id)
        .single();

      if (!professionalUser?.email) throw new Error('Professional email not found');

      const loginUrl = `${Deno.env.get('FRONTEND_URL') || 'https://workinggo.com'}/professional`;
      const template = getWorkCompletedTemplate(
        professional.display_name || 'Profesional',
        client?.full_name || 'Cliente',
        loginUrl
      );

        const result = await sendEmail(professionalUser.email, template.subject, template.html);
      
        return jsonResponse({ success: true, data: result });

    } else if (type === 'new_review' && hireId) {
      // Email al trabajador cuando recibe una reseña
      const { data: review } = await supabaseClient
        .from('reviews')
        .select('rating, comment, hire_id, client_id')
        .eq('hire_id', hireId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!review) throw new Error('Review not found');

      const { data: hire } = await supabaseClient
        .from('hires')
        .select('professional_id')
        .eq('id', review.hire_id)
        .single();

      if (!hire) throw new Error('Hire not found');

      const { data: client } = await supabaseClient
        .from('users')
        .select('full_name')
        .eq('id', review.client_id)
        .single();

      const { data: professional } = await supabaseClient
        .from('professionals')
        .select('user_id, display_name')
        .eq('id', hire.professional_id)
        .single();

      if (!professional?.user_id) throw new Error('Professional not found');

      const { data: professionalUser } = await supabaseClient
        .from('users')
        .select('email')
        .eq('id', professional.user_id)
        .single();

      if (!professionalUser?.email) throw new Error('Professional email not found');

      const loginUrl = `${Deno.env.get('FRONTEND_URL') || 'https://workinggo.com'}/professional`;
      const template = getNewReviewTemplate(
        professional.display_name || 'Profesional',
        client?.full_name || 'Cliente',
        review.rating,
        review.comment || '',
        loginUrl
      );

        const result = await sendEmail(professionalUser.email, template.subject, template.html);
      

        return jsonResponse({ success: true, data: result });

    } else if (type === 'guest_contact' && hireId) {
      // Emails para flujo de invitado: uno al profesional y otro al cliente
      const { data: hire } = await supabaseClient
        .from('hires')
        .select('guest_client_email, guest_client_phone, guest_client_name, professional_id, service_description, service_category, service_location, review_token')
        .eq('id', hireId)
        .single();

      if (!hire) throw new Error('Hire not found');

      const { data: professional } = await supabaseClient
        .from('professionals')
        .select('user_id, display_name, phone')
        .eq('id', hire.professional_id)
        .single();

      if (!professional?.user_id) throw new Error('Professional not found');

      const { data: professionalUser } = await supabaseClient
        .from('users')
        .select('email')
        .eq('id', professional.user_id)
        .single();

      const professionalEmail = professionalUser?.email || 'No disponible';
      const professionalPhone = professional?.phone || 'No disponible';
      const profileUrl = `${baseUrl.replace(/\/$/, '')}/professional/${hire.professional_id}`;
      const serviceCategory = hire.service_category || 'Categoría no especificada';
      const serviceDescription = hire.service_description || 'Sin descripción';
      const serviceLocation = hire.service_location || 'Ubicación no especificada';

      if (professionalUser?.email) {
        const workerTemplate = getGuestContactWorkerTemplate(
          professional.display_name || 'Profesional',
          hire.guest_client_name || 'Cliente',
          hire.guest_client_email || 'No disponible',
          hire.guest_client_phone || 'No disponible',
          serviceCategory,
          serviceDescription,
          serviceLocation,
          baseUrl
        );

        await sendEmail(professionalUser.email, workerTemplate.subject, workerTemplate.html);
      }

      if (hire.guest_client_email) {
        const clientTemplate = getGuestContactClientTemplate(
          hire.guest_client_name || 'Cliente',
          professional?.display_name || 'Profesional',
          professionalPhone,
          professionalEmail,
          serviceCategory,
          serviceDescription,
          serviceLocation,
          baseUrl,
          hire.review_token
        );

        await sendEmail(hire.guest_client_email, clientTemplate.subject, clientTemplate.html);
      }

      return jsonResponse({ success: true });

    } else if (type === 'completion_requested_guest' && hireId) {
      // Email al invitado cuando el profesional solicita finalización del trabajo
      const { data: hire } = await supabaseClient
        .from('hires')
        .select('guest_client_email, guest_client_name, professional_id, service_description, service_category, review_token')
        .eq('id', hireId)
        .single();

      if (!hire) throw new Error('Hire not found');
      if (!hire.guest_client_email) throw new Error('Guest client email not found');

      const { data: professional } = await supabaseClient
        .from('professionals')
        .select('display_name')
        .eq('id', hire.professional_id)
        .single();

      const reviewUrl = hire.review_token 
        ? `${baseUrl.replace(/\/$/, '')}/review/${hire.review_token}`
        : undefined;

      const template = getGuestCompletionRequestedTemplate(
        hire.guest_client_name || 'Cliente',
        professional?.display_name || 'Profesional',
        hire.service_category || undefined,
        hire.service_description || undefined,
        reviewUrl
      );

      await sendEmail(hire.guest_client_email, template.subject, template.html);

      return jsonResponse({ success: true });

    } else {
      throw new Error('Invalid request type or missing parameters');
    }

  } catch (error) {
    console.error('Error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
})
