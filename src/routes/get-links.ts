import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { prisma } from '../lib/prisma'

import z from 'zod'

export async function getLinks(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/trips/:tripId/links',
    {
      schema: {
        params: z.object({
          tripId: z.string().uuid(),
        })
      },
    }
    ,
    async (req, res) => {
      const { tripId } = req.params

      const trip = await prisma.trip.findUnique({
        where: {
          id: tripId
        },
        include: { links: true }
      })

      if (!trip) {
        throw new Error('Trip not found')
      }

      const { links } = trip

      return res.status(200).send({ links })
    })
}