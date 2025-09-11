// payment.js

import axios from "axios";
import { unifiedusersCollection } from "./db/models/unifiedusers.js";
import {
  upsertunifieduser,
  updateunifieduserById,
} from "./services/unifiedusers.js";
import env from "./utils/env.js";

// Переменные окружения для MonoBank
const monoBankToken = env("MONOBANK_TOKEN");
const monoBankWebhookUrl = env(
  "MONOBANK_WEBHOOK_URL",
  "https://ourforms.women.place/api/payment-callback"
);

// ---------- Обработчик для создания платежа ----------
export const createPaymentHandler = async (req, res, next) => {
  const { user } = req.body;

  // LOG: Логируем полученный payload перед обработкой
  console.log("📢 [createPaymentHandler] Получен запрос на создание платежа.");
  console.log("Тело запроса (req.body):", JSON.stringify(req.body, null, 2));

  if (!user) {
    console.error(
      "❌ [createPaymentHandler] Отсутствует обязательный объект 'user' в запросе."
    );
    return res.status(400).json({
      error: "Отсутствует обязательный объект user в запросе.",
    });
  }

  let paymentDataArray;
  let eventType;
  let totalAmountFromFrontend;

  // Определяем, какой массив использовать (sexIQ или conferences)
  if (user.sexIQ && user.sexIQ.length > 0) {
    paymentDataArray = user.sexIQ;
    eventType = user.sexIQ[0]?.event;
    totalAmountFromFrontend = paymentDataArray[0]?.totalAmount;
  } else if (user.conferences && user.conferences.length > 0) {
    paymentDataArray = user.conferences;
    eventType = user.conferences[0]?.conference;
    totalAmountFromFrontend = paymentDataArray[0]?.totalAmount;
  } else {
    console.error(
      "❌ [createPaymentHandler] Отсутствуют обязательные поля sexIQ или conferences в запросе."
    );
    return res.status(400).json({
      error: "Отсутствуют обязательные поля sexIQ или conferences в запросе.",
    });
  }

  if (
    typeof totalAmountFromFrontend !== "number" ||
    totalAmountFromFrontend <= 0
  ) {
    console.error(
      "❌ [createPaymentHandler] Некорректная или отсутствующая сумма для оплаты."
    );
    return res.status(400).json({ error: "Некорректная сумма для оплаты" });
  }

  try {
    const { unifieduser } = await upsertunifieduser(user);

    const amountInCents = Math.round(totalAmountFromFrontend * 100);
    const currencyCodeEUR = 978; // EUR

    console.log(
      `💶 [createPaymentHandler] Создание платежа на сумму: ${totalAmountFromFrontend} EUR (${amountInCents} центов)`
    );

    // ----------- ЛОГИКА РЕДИРЕКТА -----------
     const redirectUrls = {
       "Viena Dinner": "https://ourforms.women.place/thank-viena",
       "Other event": "https://ourforms.women.place/thankyou-other",
       prahakod: "https://prahakod.women.place/thank-you", // ✅ Обновленный URL
       barcelonakod: "https://barcelonakod.women.place/thank-you", // ✅ Добавленный URL
       vienakod: "https://vienakod.women.place/thank-you", // ✅ Добавленный URL
       warsawkod: "https://warsawkod.women.place/thank-you", // ✅ Добавленный URL
       sexiq: "https://ourforms.women.place/sexiqstandart",
       default: "https://ourforms.women.place/thankyou",
     };

    const paymentRedirectUrl = redirectUrls[eventType] || redirectUrls.default;

    // ----------- Запрос в Monobank -----------
    const monoResponse = await axios.post(
      "https://api.monobank.ua/api/merchant/invoice/create",
      {
        amount: amountInCents,
        ccy: currencyCodeEUR,
        redirectUrl: paymentRedirectUrl,
        webHookUrl: monoBankWebhookUrl,
      },
      {
        headers: {
          "X-Token": monoBankToken,
          "Content-Type": "application/json",
        },
      }
    );

    const paymentData = {
      invoiceId: monoResponse.data.invoiceId,
      status: "pending",
    };

    // Обновляем unifieduser с данными о платеже
    const sexIQIndex = unifieduser.sexIQ.findIndex(
      (item) => item.event === eventType
    );
    const conferencesIndex = unifieduser.conferences.findIndex(
      (item) => item.conference === eventType
    );

    if (sexIQIndex !== -1) {
      unifieduser.sexIQ[sexIQIndex].paymentData = paymentData;
      await updateunifieduserById(unifieduser._id, {
        sexIQ: unifieduser.sexIQ,
      });
    } else if (conferencesIndex !== -1) {
      unifieduser.conferences[conferencesIndex].paymentData = paymentData;
      await updateunifieduserById(unifieduser._id, {
        conferences: unifieduser.conferences,
      });
    }

    console.log("✅ [createPaymentHandler] Платеж успешно создан.");
    res.status(200).json({
      invoiceId: monoResponse.data.invoiceId,
      pageUrl: monoResponse.data.pageUrl,
    });
  } catch (error) {
    console.error(
      "❌ [createPaymentHandler] Ошибка при создании оплаты:",
      error
    );
    next(error);
  }
};

// ---------- Обработчик для callback MonoBank ----------
export const paymentCallbackHandler = async (req, res, next) => {
  const { invoiceId, status } = req.body;

  if (!invoiceId || !status) {
    console.log("Missing invoiceId or status in callback.");
    return res.status(400).json({ error: "Missing invoiceId or status" });
  }

  try {
    const unifieduser = await unifiedusersCollection.findOne({
      "sexIQ.paymentData.invoiceId": invoiceId,
    });

    if (!unifieduser) {
      console.log("Invoice not found for invoiceId:", invoiceId);
      return res.status(404).json({ error: "Invoice not found" });
    }

    const statusMap = {
      success: "paid",
      pending: "pending",
      failure: "failed",
    };
    const monoStatus = status.toLowerCase();

    // Находим правильный sexIQ элемент
    const sexIQEntry = unifieduser.sexIQ.find(
      (entry) => entry.paymentData?.invoiceId === invoiceId
    );

    if (sexIQEntry && sexIQEntry.paymentData) {
      sexIQEntry.paymentData.status = statusMap[monoStatus] || "failed";

      await updateunifieduserById(unifieduser._id, {
        sexIQ: unifieduser.sexIQ,
      });
      console.log(
        `Unified user ${unifieduser._id} saved successfully AFTER payment callback.`
      );
    } else {
      console.warn(
        `⚠️ Информация о платеже для invoiceId ${invoiceId} не найдена в unifieduser ${unifieduser._id}`
      );
    }

    res.status(200).json({ message: "Payment status updated" });
  } catch (error) {
    console.error("Error in payment-callback:", error);
    next(error);
  }
};
