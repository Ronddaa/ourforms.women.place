import { Schema, model } from "mongoose";
import { type } from "os";

const unifiedUserSchema = new Schema(
  {
    // --- Добавлены/скорректированы корневые поля ---
    fullName: {
      firstName: { type: String, default: "" }, // Имя пользователя
      lastName: { type: String, default: "" }, // Фамилия пользователя
    },
    phoneNumber: { type: String, default: "" }, // Телефон пользователя
    email: { type: String, default: "" }, // Почта пользователя
    // --- Конец добавленных/скорректированных корневых полей ---
    telegram: {
      id: { type: String, default: "" }, // Уникальный телеграм Id
      userName: { type: String, default: "" }, // Ник пользователя в телеграме
      firstName: { type: String, default: "" }, // Имя пользователя
      languageCode: { type: String, default: "" },
      phone: { type: String, default: "" }, // Телефон пользователя, если доступен
      isPremium: { type: Boolean, default: false },
      source: { type: [String], default: [] }, // Исходный путь, с какой платформы человек попал в телеграм Бота (массив строк)
      transitions: [
        {
          date: { type: Date, default: Date.now }, // Дата перехода
          source: { type: String, default: "" },
        },
      ],
    },
    sexIQ: {
      type: { type: String, enum: ["online", "offline"], default: "" },
      ticketType: { type: String, default: "" },
      totalAmount: { type: Number, default: "" }
    },
    conferences: [
      {
        conference: { type: String, default: "" }, // Название конференции или встречи
        type: { type: String, enum: ["online", "offline"], default: "" }, // Онлайн или офлайн встреча
        ticketType: { type: String, default: "" }, // Тип билета или тарифа
        ticketsQuantity: { type: Number, default: "" }, // Количество билетов или мест на мероприятие
        totalAmount: { type: Number, default: "" }, // Общая сумма потраченная на покупку мест или билетов
        takeBrunch: { type: Boolean, default: false }, // Была ли выбрана опция "Бранч"
        paymentData: {
          invoiceId: String, // ID инвойса для оплаты
          status: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "pending",
          }, // Статус оплаты
        },
        promoCode: { type: String, default: "" }, // Промокод, если использовался
        utmMarks: [
          {
            source: { type: String, default: "" },
            medium: { type: String, default: "" },
            campaign: { type: String, default: "" },
          },
        ], // Массив UTM меток
        moreInfo: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
    strict: true,
  }
);

export const unifiedusersCollection = model("UnifiedUser", unifiedUserSchema);
