import Joi from "joi";

export const createunifieduserSchema = Joi.object({
  fullName: Joi.object({
    firstName: Joi.string().allow(""),
    lastName: Joi.string().allow(""),
  }),
  phoneNumber: Joi.string().allow(""),
  email: Joi.string().email().allow(""),
  telegram: Joi.object({
    id: Joi.string().allow("", null),
    userName: Joi.string().allow("", null),
    firstName: Joi.string().allow("", null),
    languageCode: Joi.string().allow("", null),
    phone: Joi.string().allow("", null),
    isPremium: Joi.boolean().allow(null),
    source: Joi.array().items(Joi.string()).default([]),
    transitions: Joi.array()
      .items(
        Joi.object({
          date: Joi.date().allow(null, ""),
          source: Joi.string().allow("", null),
        })
      )
      .default([]),
  }).optional(),
  sexIQ: Joi.array()
    .items(
      Joi.object({
        event: Joi.string().required(),
        type: Joi.string().valid("online", "offline").required(),
        ticketType: Joi.string().required(),
        totalAmount: Joi.number().min(0).required(),
        paymentData: Joi.object({
          invoiceId: Joi.string().allow("", null),
          status: Joi.string()
            .valid("pending", "paid", "failed")
            .default("pending"),
        }).optional(),
      })
    )
    .required()
    .min(1),
  conferences: Joi.array()
    .items(
      Joi.object({
        conference: Joi.string(),
        type: Joi.string().valid("online", "offline"),
        ticketType: Joi.string(),
        ticketsQuantity: Joi.number().integer().min(1),
        totalAmount: Joi.number().min(0).optional().default(0),
        takeBrunch: Joi.boolean().default(false),
        paymentData: Joi.object({
          invoiceId: Joi.string().allow("", null),
          status: Joi.string()
            .valid("pending", "paid", "failed")
            .default("pending"),
        }).optional(),
        promoCode: Joi.string().allow("", null).default(""),
        utmMarks: Joi.array()
          .items(
            Joi.object({
              source: Joi.string().allow("", null).default(""),
              medium: Joi.string().allow("", null).default(""),
              campaign: Joi.string().allow("", null).default(""),
            })
          )
          .default([]),
        moreInfo: Joi.string().allow("", null).default(""),
      })
    )
    .min(1),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
}).unknown(true);
