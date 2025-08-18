import axios from "axios";
import { unifiedusersCollection } from "./db/models/unifiedusers.js";
import {
  upsertunifieduser,
  updateunifieduserById,
} from "./services/unifiedusers.js";
import env from "./utils/env.js";

// Переменные окружения для MonoBank, предполагается, что они будут в вашем env файле
const monoBankToken = env("MONOBANK_TOKEN");
const monoBankRedirectUrl = env(
  "MONOBANK_REDIRECT_URL",
  "https://ourforms.women.place/sexiqstandart"
);
const monoBankWebhookUrl = env(
  "MONOBANK_WEBHOOK_URL",
  "https://ourforms.women.place/api/payment-callback"
);

// ---------- Обработчик для создания платежа ----------
export const createPaymentHandler = async (req, res, next) => {
  // ✅ ИСПРАВЛЕНО: Фронтенд отправляет все данные в объекте 'user'.
  const { user } = req.body;

  if (!user || !user.sexIQ || !user.sexIQ.totalAmount) {
    return res.status(400).json({
      error: "Отсутствуют обязательные поля user или sexIQ в запросе.",
    });
  }

  try {
    // ✅ ИСПРАВЛЕНО: Извлекаем sexIQ из объекта 'user', как на фронтенде
    const { sexIQ, ...restOfUser } = user;
    const totalAmountFromFrontend = sexIQ.totalAmount;

    if (
      typeof totalAmountFromFrontend !== "number" ||
      totalAmountFromFrontend <= 0
    ) {
      return res.status(400).json({ error: "Некорректная сумма для оплаты" });
    }

    // ✅ Передаем 'user' и 'sexIQ' как отдельные объекты в сервис upsertunifieduser
    const { unifieduser } = await upsertunifieduser({
      ...restOfUser,
    });
    // ✅ Используем _id пользователя, так как sexIQ является отдельным полем
    const userId = unifieduser._id;

    const amountInCents = Math.round(totalAmountFromFrontend * 100);
    const currencyCodeEUR = 978; // Код валюты для EUR
    console.log(
      `💶 Создание платежа на сумму: ${totalAmountFromFrontend} EUR (${amountInCents} центов)`
    );

    const redirectUrl = `${monoBankRedirectUrl}/${userId}/sexIQ-payment`;
    const monoResponse = await axios.post(
      "https://api.monobank.ua/api/merchant/invoice/create",
      {
        amount: amountInCents,
        ccy: currencyCodeEUR, // Используем код для EUR
        redirectUrl,
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

    // ✅ ИСПРАВЛЕНО: Обновляем поле sexIQ.paymentData напрямую
    unifieduser.sexIQ.paymentData = paymentData;

    await updateunifieduserById(unifieduser._id, {
      sexIQ: unifieduser.sexIQ,
    });

    res.status(200).json({
      invoiceId: monoResponse.data.invoiceId,
      pageUrl: monoResponse.data.pageUrl,
    });
  } catch (error) {
    console.error("Ошибка при создании оплаты:", error);
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
    // ✅ ИСПРАВЛЕНО: Ищем по invoiceId в поле sexIQ
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

    // ✅ ИСПРАВЛЕНО: Обновляем статус в поле sexIQ напрямую, без поиска
    if (unifieduser.sexIQ && unifieduser.sexIQ.paymentData) {
      unifieduser.sexIQ.paymentData.status = statusMap[monoStatus] || "failed";

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
