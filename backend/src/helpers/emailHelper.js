import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: (process.env.SMTP_SECURE || 'false') === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const FROM_EMAIL = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'G4 Delivery <no-reply@gmail.com>';

export const APP_BASE_URL = process.env.APP_BASE_URL || 'https://go4-app.example.com';

/**
 * Send a password reset email containing a link the user can open to reset their password.
 */
export async function sendPasswordResetEmail({ to, resetToken }) {
  const link = `${APP_BASE_URL}/reset-password?token=${resetToken}`;

  const info = await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: 'Reset your G4 Delivery password',
    text: `Hello,\n\nWe received a request to reset your G4 Delivery password.\n\nClick the link below to choose a new password (valid for 30 minutes):\n\n${link}\n\nIf you did not request this, you can safely ignore this email.\n\n— G4 Delivery`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #F4F7FE; border-radius: 12px;">
        <div style="background: #ffffff; padding: 28px; border-radius: 12px;">
          <h2 style="margin: 0 0 12px; color: #1B2559;">Reset your password</h2>
          <p style="margin: 0 0 20px; color: #64748b; font-size: 14px; line-height: 1.6;">
            We received a request to reset your G4 Delivery password. Click the button below to choose a new password (valid for 30 minutes).
          </p>
          <a href="${link}" style="display: inline-block; background: #F25C22; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 14px;">
            Reset password
          </a>
          <p style="margin: 24px 0 0; color: #A3AED0; font-size: 12px; line-height: 1.6;">
            If the button doesn't work, copy this link into your browser:<br>
            <span style="word-break: break-all;">${link}</span>
          </p>
          <p style="margin: 20px 0 0; color: #A3AED0; font-size: 12px;">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
        <p style="text-align: center; color: #A3AED0; font-size: 12px; margin-top: 16px;">— G4 Delivery</p>
      </div>
    `,
  });

  return info;
}

const shell = (title, bodyHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #F4F7FE; border-radius: 12px;">
    <div style="background: #ffffff; padding: 28px; border-radius: 12px;">
      <h2 style="margin: 0 0 12px; color: #1B2559;">${title}</h2>
      ${bodyHtml}
    </div>
    <p style="text-align: center; color: #A3AED0; font-size: 12px; margin-top: 16px;">— G4 Delivery</p>
  </div>
`;

const orderItemsHtml = (items) => `
  <table style="width: 100%; border-collapse: collapse; margin: 12px 0;">
    <tbody>
      ${(items || []).map(i => `
        <tr style="border-bottom: 1px solid #F4F7FE;">
          <td style="padding: 8px 0; color: #1B2559; font-size: 14px;">${i.product_name || 'Item'} × ${i.quantity || 1}</td>
          <td style="padding: 8px 0; color: #64748b; font-size: 14px; text-align: right;">ETB ${Number(i.price || 0).toFixed(2)}</td>
        </tr>
      `).join('')}
      <tr>
        <td style="padding: 10px 0; color: #1B2559; font-size: 14px; font-weight: bold;">Total</td>
        <td style="padding: 10px 0; color: #F25C22; font-size: 14px; font-weight: bold; text-align: right;">ETB ${Number(items || []).reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 1), 0).toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
`;

export async function sendWelcomeEmail({ to, name }) {
  const info = await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to G4 Delivery 🎉',
    text: `Hello ${name},\n\nWelcome to G4 Delivery! Your account is ready. Order food and get it delivered fast.\n\n— G4 Delivery`,
    html: shell('Welcome to G4 Delivery 🎉', `
      <p style="margin: 0 0 20px; color: #64748b; font-size: 14px; line-height: 1.6;">
        Hello <strong style="color: #1B2559;">${name}</strong>, welcome to G4 Delivery! Your account is ready.
      </p>
      <p style="margin: 0 0 20px; color: #64748b; font-size: 14px; line-height: 1.6;">
        Order your favorite food and get it delivered fast to your door.
      </p>
    `),
  });
  return info;
}

export async function sendOrderConfirmationEmail({ to, name, order }) {
  const items = order.items || [];
  const info = await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: `Order confirmed — ${order.order_name || 'G4 Delivery'}`,
    text: `Hello ${name},\n\nYour order ${order.order_name || ''} has been placed successfully.\nTotal: ETB ${Number(order.total_price || 0).toFixed(2)}\n\nWe'll notify you when a rider accepts it.\n\n— G4 Delivery`,
    html: shell('Order confirmed ✅', `
      <p style="margin: 0 0 12px; color: #64748b; font-size: 14px; line-height: 1.6;">
        Hello <strong style="color: #1B2559;">${name}</strong>, your order
        <strong style="color: #1B2559;">${order.order_name || ''}</strong> has been placed successfully.
      </p>
      ${orderItemsHtml(items)}
      <p style="margin: 16px 0 0; color: #A3AED0; font-size: 13px; line-height: 1.6;">
        Delivery to: ${order.delivery_address || '—'}<br>
        We'll notify you as soon as a rider accepts your order.
      </p>
    `),
  });
  return info;
}

export async function sendOrderStatusEmail({ to, name, order, status }) {
  const statusCopy = {
    accepted: { emoji: '🛵', title: 'Rider on the way!', body: 'A rider has accepted your order and is heading to pick it up.' },
    picked_up: { emoji: '📦', title: 'Order picked up', body: 'Your rider has picked up your order.' },
    in_transit: { emoji: '🚚', title: 'Order in transit', body: 'Your order is on its way to you.' },
    delivered: { emoji: '🎉', title: 'Order delivered!', body: 'Your order has been delivered. Enjoy!' },
    cancelled: { emoji: '❌', title: 'Order cancelled', body: 'Your order has been cancelled.' },
  }[status] || { emoji: '📋', title: 'Order update', body: 'Your order status has been updated.' };

  const info = await transporter.sendMail({
    from: FROM_EMAIL,
    to,
    subject: `${statusCopy.emoji} ${statusCopy.title} — ${order.order_name || 'G4 Delivery'}`,
    text: `Hello ${name},\n\n${statusCopy.body}\n\nOrder: ${order.order_name || ''}\n\n— G4 Delivery`,
    html: shell(`${statusCopy.emoji} ${statusCopy.title}`, `
      <p style="margin: 0 0 12px; color: #64748b; font-size: 14px; line-height: 1.6;">
        Hello <strong style="color: #1B2559;">${name}</strong>, ${statusCopy.body}
      </p>
      <p style="margin: 0 0 12px; color: #1B2559; font-size: 14px;">
        Order: <strong>${order.order_name || ''}</strong>
      </p>
      ${status === 'delivered' ? orderItemsHtml(order.items) : ''}
    `),
  });
  return info;
}
