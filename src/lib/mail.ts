import nodemailer from 'nodemailer'

export async function getMailClient() {
  const account = await nodemailer.createTestAccount()

  const transporter = nodemailer.createTransport({
    host: 'smtp.ehtereal.email',
    port: 507,
    secure: false,
    auth: {
      user: account.user,
      pass: account.pass,
    }
  })

  return transporter
}

