import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { prisma } from '../lib/prisma'


import z from 'zod'
import { ClientError } from '../errors/client-error'

export async function getParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/participants/:participantId',
    {
      schema: {
        params: z.object({
          participantId: z.string().uuid(),
        })
      },
    }
    ,
    async (req, res) => {
      const { participantId } = req.params

      const participant = await prisma.participant.findUnique({
        where: {
          id: participantId
        },
        select: {
          id: true,
          name: true,
          email: true,
          is_confirmed: true,
        }
      })

      if (!participant) {
        throw new ClientError('participant not found')
      }

      return res.status(200).send({ participant })
    })
}