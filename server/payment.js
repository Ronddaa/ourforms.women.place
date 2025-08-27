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

  if (
    !user ||
    !user.sexIQ ||
    user.sexIQ.length === 0 ||
    !user.sexIQ[0].totalAmount
  ) {
    return res.status(400).json({
      error: "Отсутствуют обязательные поля user или sexIQ в запросе.",
    });
  }

  try {
    // Сохраняем/обновляем unifieduser
    const { unifieduser, sexIQIndex } = await upsertunifieduser(user);

    const totalAmountFromFrontend = unifieduser.sexIQ[sexIQIndex]?.totalAmount;
    if (
      typeof totalAmountFromFrontend !== "number" ||
      totalAmountFromFrontend <= 0
    ) {
      return res.status(400).json({ error: "Некорректная сумма для оплаты" });
    }

    const amountInCents = Math.round(totalAmountFromFrontend * 100);
    const currencyCodeEUR = 978; // EUR
    console.log(
      `💶 Создание платежа на сумму: ${totalAmountFromFrontend} EUR (${amountInCents} центов)`
    );

    // ----------- ЛОГИКА РЕДИРЕКТА -----------
    const eventType = unifieduser.sexIQ[sexIQIndex]?.event;

    const redirectUrls = {
      "Viena Dinner": "https://ourforms.women.place/thank-viena",
      "Other event": "https://ourforms.women.place/thankyou-other",
      default: "https://ourforms.women.place/sexiqstandart",
    };

    const paymentRedirectUrl = redirectUrls[eventType] || redirectUrls.default;

    // ----------- Запрос в Monobank -----------
    const monoResponse = await axios.post(
      "https://api.monobank.ua/api/merchant/invoice/create",
      {
        amount: amountInCents,
        ccy: currencyCodeEUR,
        redirectUrl: paymentRedirectUrl, // ✅ сразу страница "спасибо"
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
    unifieduser.sexIQ[sexIQIndex].paymentData = paymentData;

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
