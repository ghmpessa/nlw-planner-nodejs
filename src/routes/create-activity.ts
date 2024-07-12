import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { prisma } from '../lib/prisma'

import { z } from 'zod'
import { dayjs } from '../lib/dayjs'
import { ClientError } from '../errors/client-error'

export async function createActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/trips/:tripId/activities', {
    schema: {
      body: z.object({
        title: z.string().min(4),
        occurs_at: z.coerce.date(),
      }),
      params: z.object({
        tripId: z.string().uuid()
      })
    }
  }, async (req, res) => {
    const { tripId } = req.params
    const { title, occurs_at } = req.body

    const trip = await prisma.trip.findUnique({
      where: {
        id: tripId
      },
    })

    if (!trip) {
      throw new ClientError('Trip not found')
    }

    if (dayjs(occurs_at).isBefore(trip.starts_at)) {
      throw new ClientError('Invailid activity date')
    }

    if (dayjs(occurs_at).isAfter(trip.ends_at)) {
      throw new ClientError('Invailid activity date')
    }

    const { id: activityId } = await prisma.activity.create({
      data: {
        title,
        occurs_at,
        trip_id: tripId
      }
    })

    return res.status(201).send({ activityId })
  })
}