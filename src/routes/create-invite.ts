import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { prisma } from '../lib/prisma'
import { dayjs } from '../lib/dayjs'

import z from 'zod'
import { getMailClient } from '../lib/mail'
import { ClientError } from '../errors/client-error'
import { env } from '../env'

export async function createInvite(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/trips/:tripId/invite',
    {
      schema: {
        body: z.object({
          email: z.string().email(),
        }),
        params: z.object({
          tripId: z.string().uuid(),
        })
      },
    },
    async (req, res) => {
      const { tripId } = req.params
      const { email } = req.body

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId
        },
        include: {
          participants: {
            select: {
              email: true
            }
          }
        }
      })

      if (!trip) {
        throw new ClientError('Trip not found')
      }

      const emails = trip.participants.map(participant => participant.email)

      if (emails.includes(email)) {
        throw new ClientError('E-mail already invited')
      }

      const participant = await prisma.participant.create({
        data: {
          email,
          trip_id: tripId,
        }
      })

      const formattedStartDate = dayjs(trip.starts_at).format('LL')
      const formattedEndDate = dayjs(trip.ends_at).format('LL')

      const mail = await getMailClient()


      const confirmationLink = `${env.API_BASE_URL}/participants/${participant.id}/confirm`

      await mail.sendMail({
        from: {
          name: 'Equipe plann.er',
          address: 'contato@plann.er'
        },
        to: {
          name: participant.name ?? 'Colega',
          address: email,
        },
        subject: `Confirme sua presença na viagem para ${trip.destination} em ${formattedStartDate}`,
        html: `
      <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
        <p>Você foi convidado(a) para participar de uma viagem para <strong>${trip.destination}</strong> nas datas de <strong>${formattedStartDate}</strong> até <strong>${formattedEndDate}</strong>.</p>
        <p></p>
        <p>Para confirmar sua presença na viagem, clique no link abaixo:</p>
        <p></p>
        <p>
          <a href="${confirmationLink}">Confirmar viagem</a>
        </p>
        <p></p>
        <p>Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-mail.</p>
      </div>
      `.trim(),
      })


      res.status(201).send({ participantId: participant.id })
    })
}