import { prisma } from '../lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { z } from 'zod'

export async function createLink(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/links', {
    schema: {
      body: z.object({
        title: z.string().min(4),
        url: z.string().url(),
      }),
      params: z.object({
        tripId: z.string().uuid()
      })
    }
  }, async (req, res) => {
    const { tripId } = req.params
    const { title, url } = req.body

    const trip = await prisma.trip.findUnique({
      where: {
        id: tripId
      },
    })

    if (!trip) {
      throw new Error('Trip not found')
    }

    const { id: linkId } = await prisma.link.create({
      data: {
        title,
        url,
        trip_id: tripId
      }
    })

    return res.status(201).send({ linkId })
  })
}