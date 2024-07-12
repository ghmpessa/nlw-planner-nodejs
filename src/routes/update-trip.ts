import { prisma } from '../lib/prisma'
import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'

import { z } from 'zod'
import { dayjs } from '../lib/dayjs'
import { ClientError } from '../errors/client-error'

export async function updateTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put('/trips/:tripId', {
    schema: {
      body: z.object({
        destination: z.string().min(4),
        starts_at: z.coerce.date(),
        ends_at: z.coerce.date(),
      }),
      params: z.object({
        tripId: z.string().uuid()
      })
    }
  }, async (req, res) => {
    const {
      destination,
      starts_at,
      ends_at,
    } = req.body
    const { tripId } = req.params


    const trip = await prisma.trip.findUnique({
      where: {
        id: tripId
      },
      include: { links: true }
    })

    if (!trip) {
      throw new ClientError('Trip not found')
    }

    if (dayjs(starts_at).isBefore(new Date())) {
      throw new ClientError('Invalid trip start date.')
    }

    if (dayjs(ends_at).isBefore(starts_at)) {
      throw new ClientError('Invalid trip end date.')
    }

    await prisma.trip.update({
      where: {
        id: tripId
      },
      data: {
        destination,
        starts_at,
        ends_at,
      }
    })

    return res.status(201).send({ tripId })
  })
}