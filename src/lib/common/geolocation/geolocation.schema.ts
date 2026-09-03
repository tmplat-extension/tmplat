import { z } from 'zod';

export const GeolocationCoordsSchema = z
  .object({
    accuracy: z.number(),
    altitude: z.number().nullable(),
    altitudeAccuracy: z.number().nullable(),
    heading: z.number().nullable(),
    latitude: z.number(),
    longitude: z.number(),
    speed: z.number().nullable(),
  })
  .meta({ id: 'GeolocationCoords' });

export type GeolocationCoords = z.infer<typeof GeolocationCoordsSchema>;
