import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { prisma } from '../lib/prisma'


import z from 'zod'

export async function confirmParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/participants/:participantId/confirm',
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
        }
      })

      if (!participant) {
        throw new Error('Participant not found')
      }

      if (participant.is_confirmed) {
        return res.redirect(`http://localhost:3000/trips/${participant.trip_id}`)
      }

      return res.redirect(`http://localhost:3000/trips/${participant.trip_id}`)
    })
}