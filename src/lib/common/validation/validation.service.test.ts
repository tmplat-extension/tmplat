import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ExtensionError } from 'extension/common/error/extension-error';
import { type LoggingService } from 'extension/common/logging/logging.service';
import { SchemaValidator } from 'extension/common/validation/schema-validator';
import { ValidationService } from 'extension/common/validation/validation.service';
import { createLoggerMock, createLoggingServiceMock, type LoggingServiceMock } from 'extension/test/logger.mock';

const Schema = z
  .object({
    enabled: z.boolean(),
    name: z.string(),
  })
  .meta({ id: 'TestSchema' });

const validInput = { enabled: true, name: 'a' };
const invalidInput = { enabled: 'yes' };

const createService = (): { service: ValidationService; logging: LoggingServiceMock } => {
  const logging = createLoggingServiceMock();
  const service = new ValidationService(logging as unknown as LoggingService);
  return { service, logging };
};

describe('ValidationService', () => {
  describe('isValidSchema', () => {
    it('returns true for valid input', () => {
      const { service } = createService();
      expect(service.isValidSchema(validInput, Schema)).toBe(true);
    });

    it('returns false for invalid input', () => {
      const { service } = createService();
      expect(service.isValidSchema(invalidInput, Schema)).toBe(false);
    });
  });

  describe('validateSchema', () => {
    it('returns the parsed output for valid input', () => {
      const { service } = createService();
      expect(service.validateSchema(validInput, Schema, 'ERR422000')).toEqual(validInput);
    });

    it('throws an ExtensionError with the given code for invalid input and logs via the service logger', () => {
      const { service, logging } = createService();

      expect(() => service.validateSchema(invalidInput, Schema, 'ERR422000')).toThrow(ExtensionError);
      try {
        service.validateSchema(invalidInput, Schema, 'ERR422000');
      } catch (e) {
        expect((e as ExtensionError).code).toBe('ERR422000');
      }
      expect(logging.logger.error).toHaveBeenCalled();
    });

    it('accepts an options object and honours a parentLogger override', () => {
      const { service } = createService();
      const parentLogger = createLoggerMock();

      expect(() => service.validateSchema(invalidInput, Schema, { code: 'ERR422000', parentLogger })).toThrow(
        ExtensionError,
      );
      expect(parentLogger.error).toHaveBeenCalled();
    });
  });

  describe('createSchemaValidator', () => {
    it('builds a SchemaValidator bound to the schema and code', () => {
      const { service } = createService();
      const validator = service.createSchemaValidator(Schema, 'ERR422000');

      expect(validator).toBeInstanceOf(SchemaValidator);
      expect(validator.validate(validInput)).toEqual(validInput);
      expect(() => validator.validate(invalidInput)).toThrow(ExtensionError);
    });

    it('accepts an options object', () => {
      const { service } = createService();
      const validator = service.createSchemaValidator(Schema, { code: 'ERR422000' });

      expect(validator.isValid(validInput)).toBe(true);
      expect(validator.isValid(invalidInput)).toBe(false);
    });
  });
});

describe('SchemaValidator', () => {
  const createValidator = () => {
    const logger = createLoggerMock();
    const validator = new SchemaValidator({ code: 'ERR422000', logger, schema: Schema });
    return { validator, logger };
  };

  it('isValid returns whether input matches the schema', () => {
    const { validator } = createValidator();

    expect(validator.isValid(validInput)).toBe(true);
    expect(validator.isValid(invalidInput)).toBe(false);
  });

  it('validate returns parsed output for valid input', () => {
    const { validator } = createValidator();

    expect(validator.validate(validInput)).toEqual(validInput);
  });

  it('validate throws with the configured code by default', () => {
    const { validator } = createValidator();

    try {
      validator.validate(invalidInput);
      expect.unreachable();
    } catch (e) {
      expect((e as ExtensionError).code).toBe('ERR422000');
    }
  });

  it('validate can override the error code per call', () => {
    const { validator } = createValidator();

    try {
      validator.validate(invalidInput, 'ERR500000');
      expect.unreachable();
    } catch (e) {
      expect((e as ExtensionError).code).toBe('ERR500000');
    }
  });

  it('validate can override the error code via an options object', () => {
    const { validator } = createValidator();

    try {
      validator.validate(invalidInput, { code: 'ERR500000' });
      expect.unreachable();
    } catch (e) {
      expect((e as ExtensionError).code).toBe('ERR500000');
    }
  });
});
