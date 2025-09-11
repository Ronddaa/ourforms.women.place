import Joi from "joi";

export const createunifieduserSchema = Joi.object({
  fullName: Joi.object({
    firstName: Joi.string().allow("", null),
    lastName: Joi.string().allow("", null),
  }).optional(),
  phoneNumber: Joi.string().allow("", null),
  email: Joi.string().email().allow("", null),
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
        event: Joi.string().allow("", null),
        type: Joi.string().valid("online", "offline").allow("", null),
        ticketType: Joi.string().allow("", null),
        totalAmount: Joi.number().min(0).allow(null).default(0),
        paymentData: Joi.object({
          invoiceId: Joi.string().allow("", null),
          status: Joi.string()
            .valid("pending", "paid", "failed")
            .default("pending")
            .allow("", null),
        }).optional(),
      })
    )
    .optional()
    .default([]),
  conferences: Joi.array()
    .items(
      Joi.object({
        conference: Joi.string().allow("", null),
        type: Joi.string().valid("online", "offline").allow("", null),
        ticketType: Joi.string().allow("", null),
        ticketsQuantity: Joi.number().integer().min(0).allow(null).default(0),
        totalAmount: Joi.number().min(0).allow(null).default(0),
        takeBrunch: Joi.boolean().allow(null).default(false),
        paymentData: Joi.object({
          invoiceId: Joi.string().allow("", null),
          status: Joi.string()
            .valid("pending", "paid", "failed")
            .default("pending")
            .allow("", null),
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
    .optional()
    .default([]),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
}).unknown(true);
