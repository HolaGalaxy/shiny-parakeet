import { Resend } from 'resend'
import { ERROR_MSG } from '@/constants/errors'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error(ERROR_MSG.RESEND_API_KEY_MISSING)
    _resend = new Resend(key)
  }
  return _resend
}

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

function getSenderEmail(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'
}

export async function sendInviteEmail(params: {
  toEmail: string
  toName: string | null
  inviteToken: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend()
    const verifyUrl = `${getBaseUrl()}/verify?token=${params.inviteToken}`

    const { error } = await resend.emails.send({
      from: `Switch <${getSenderEmail()}>`,
      to: params.toEmail,
      subject: 'You have been invited to Switch',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1a1a;">Welcome to Switch${params.toName ? `, ${params.toName}` : ''}!</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            An administrator has created an account for you. Click the button below to set your password and activate your account.
          </p>
          <div style="margin: 32px 0; text-align: center;">
            <a href="${verifyUrl}" style="display: inline-block; background-color: #5D87FF; color: #fff; padding: 12px 32px; border-radius: 24px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Activate Account
            </a>
          </div>
          <p style="color: #999; font-size: 13px;">
            This link will expire in 72 hours. If you did not expect this email, you can safely ignore it.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #bbb; font-size: 12px;">Switch — Configuration Management Platform</p>
        </div>
      `,
    })

    if (error) {
      console.error('[email] Failed to send invite:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    console.error('[email] Unexpected error:', err)
    return { success: false, error: ERROR_MSG.EMAIL_SEND_FAILED }
  }
}
