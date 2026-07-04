import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  ES_NODE: Joi.string().uri().required(),
  ES_USERNAME: Joi.string().required(),
  ES_PASSWORD: Joi.string().required(),
  ES_SYNC: Joi.string().valid('none', 'create', 'sync').default('create'),
});
