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
  "https://barcelonakod.women.place/thank-you"
);
const monoBankWebhookUrl = env(
  "MONOBANK_WEBHOOK_URL",
  "https://barcelonakod.women.place/api/payment-callback"
);

// ---------- Обработчик для создания платежа ----------
export const createPaymentHandler = async (req, res, next) => {
  const { user, conferences } = req.body;

  if (
    !user ||
    !conferences ||
    !Array.isArray(conferences) ||
    conferences.length === 0
  ) {
    return res
      .status(400)
      .json({ error: "Missing required fields or invalid format" });
  }

  const purchase = conferences[0];
  try {
    const totalAmountFromFrontend = purchase.totalAmount;

    if (
      typeof totalAmountFromFrontend !== "number" ||
      totalAmountFromFrontend <= 0
    ) {
      return res.status(400).json({ error: "Некорректная сумма для оплаты" });
    }

    const { unifieduser, conferenceIndex } = await upsertunifieduser({
      user,
      conferences,
    });
    const conferenceId = unifieduser.conferences[conferenceIndex]._id; // ✅ Сумма напрямую из фронтенда, конвертируем в центы

    const amountInCents = Math.round(totalAmountFromFrontend * 100);
    const currencyCodeEUR = 978; // Код валюты для EUR
    console.log(
      `💶 Создание платежа на сумму: ${totalAmountFromFrontend} EUR (${amountInCents} центов)`
    );

    const redirectUrl = `${monoBankRedirectUrl}/${unifieduser._id}/${conferenceId}`;
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

    unifieduser.conferences[conferenceIndex].paymentData = paymentData;

    await updateunifieduserById(unifieduser._id, {
      conferences: unifieduser.conferences,
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
    const unifieduser = await unifiedusersCollection.findOne({
      "conferences.paymentData.invoiceId": invoiceId,
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

    const conferenceToUpdate = unifieduser.conferences.find(
      (conf) => conf.paymentData?.invoiceId === invoiceId
    );

    if (conferenceToUpdate) {
      conferenceToUpdate.paymentData.status = statusMap[monoStatus] || "failed";

      await updateunifieduserById(unifieduser._id, {
        conferences: unifieduser.conferences,
      });
      console.log(
        `Unified user ${unifieduser._id} saved successfully AFTER payment callback.`
      );
    } else {
      console.warn(
        `⚠️ Конференция с invoiceId ${invoiceId} не найдена в unifieduser ${unifieduser._id}`
      );
    }

    res.status(200).json({ message: "Payment status updated" });
  } catch (error) {
    console.error("Error in payment-callback:", error);
    next(error);
  }
};
