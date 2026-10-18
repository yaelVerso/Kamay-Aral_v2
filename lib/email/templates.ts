import { resend, RESEND_FROM_EMAIL } from '@/lib/resend'

function wrapper(title: string, bodyHtml: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">Kamay-Aral</h2>
      <h3>${title}</h3>
      ${bodyHtml}
    </div>
  `
}

export async function sendTeacherInviteEmail(email: string, fullName: string, link: string) {
  const html = wrapper(
    'You have been invited as a teacher',
    `
      <p>Hi ${fullName},</p>
      <p>An admin has created a teacher account for you on Kamay-Aral. Click the link below to set your password and get started.</p>
      <p><a href="${link}">Set your password</a></p>
    `,
  )
  await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: email,
    subject: 'You have been invited to Kamay-Aral',
    html,
  })
}

export async function sendStudentInviteEmail(email: string, studentName: string, link: string) {
  const html = wrapper(
    'A student account has been created',
    `
      <p>Hi,</p>
      <p>A student account for <strong>${studentName}</strong> has been created on Kamay-Aral.</p>
      <p>Click the link below to set the account's password.</p>
      <p><a href="${link}">Set password</a></p>
    `,
  )
  await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: email,
    subject: 'Kamay-Aral student account created',
    html,
  })
}

export async function sendPasswordResetEmail(email: string, contextLabel: string, link: string) {
  const html = wrapper(
    'Reset your password',
    `
      <p>A password reset was requested for ${contextLabel}.</p>
      <p>Click the link below to set a new password. If you didn't request this, you can ignore this email.</p>
      <p><a href="${link}">Reset password</a></p>
    `,
  )
  await resend.emails.send({
    from: RESEND_FROM_EMAIL,
    to: email,
    subject: 'Reset your Kamay-Aral password',
    html,
  })
}
