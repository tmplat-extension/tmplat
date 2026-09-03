import { z } from 'zod';
import { GeolocationCoordsSchema } from 'extension/common/geolocation/geolocation.schema';

export const GeolocationMessageInputSchema = z.object({}).meta({ id: 'GeolocationMessageInput' });

export type GeolocationMessageInput = z.infer<typeof GeolocationMessageInputSchema>;

export const GeolocationMessageOutputSchema = z
  .object({
    coords: GeolocationCoordsSchema.nullable(),
  })
  .meta({ id: 'GeolocationMessageOutput' });

export type GeolocationMessageOutput = z.infer<typeof GeolocationMessageOutputSchema>;
