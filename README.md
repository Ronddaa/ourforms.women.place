// src/components/WomenKodTickets.js

import { useState, useEffect } from "react";
import styles from "./WomenKodTicket.module.css";
import api from "../../api/api.js";
import axios from "axios";

export default function WomenKodTickets() {
  const initialState = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    telegramNick: "",
    tariff: "",
    quantity: 1,
    promoCode: "",
    takeBrunch: false,
  };

  const [formData, setFormData] = useState(initialState);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [promoMessage, setPromoMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Состояние загрузки данных
  const [isFormFilled, setIsFormFilled] = useState(false); // Состояние, когда форма заполнена с бэкенда

  const [utmParams, setUtmParams] = useState({
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_conference: "",
    utm_tickettype: "",
    utm_totalamount: "",
  });

  const [telegramData, setTelegramData] = useState({
    id: "",
    userName: "",
    firstName: "",
    languageCode: "",
    phone: "",
    isPremium: false,
  });

  const tariffs = [
    { name: "LAST MINUTE", price: 150 },
    { name: "GOLD", price: 300 },
    { name: "PREMIUM", price: 450 },
    { name: "LUXE", price: 1200 },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newUtmParams = {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_conference: params.get("utm_conference") || "",
      utm_tickettype: params.get("utm_tickettype") || "",
      utm_totalamount: params.get("utm_totalamount") || "",
    };
    setUtmParams(newUtmParams);

    const tgData = {
      id: params.get("tg_id") || "",
      userName: params.get("tg_user_name") || "",
      firstName: params.get("tg_first_name") || "",
      languageCode: params.get("tg_language_code") || "",
      phone: params.get("tg_phone") || "",
      isPremium: params.get("tg_is_premium") === "true",
    };
    setTelegramData(tgData);

    const checkAndFillUserData = async () => {
      // Проверяем, есть ли данные Telegram в URL
      if (tgData.id || tgData.userName) {
        try {
          // Ищем пользователя на бэкенде
          const user = await api.findUserByTelegram(tgData.id, tgData.userName);

          if (user) {
            // Если пользователь найден, заполняем форму его данными
            setFormData({
              firstName: user.fullName?.firstName || "",
              lastName: user.fullName?.lastName || "",
              email: user.email || "",
              phone: user.phoneNumber || "",
              telegramNick: user.telegram?.userName || "",
              tariff: newUtmParams.utm_tickettype || "", // Заполняем тариф из UTM, если есть
              quantity: 1,
              promoCode: "",
              takeBrunch: false,
            });
            setIsFormFilled(true); // Устанавливаем флаг, что форма заполнена
          } else {
            // Если пользователь не найден, используем только данные из URL
            setFormData((prev) => ({
              ...prev,
              firstName: tgData.firstName || prev.firstName,
              telegramNick: tgData.userName || prev.telegramNick,
              phone: tgData.phone || prev.phone,
              tariff: newUtmParams.utm_tickettype || prev.tariff,
            }));
          }
        } catch (error) {
          console.error("Ошибка при поиске пользователя:", error);
          // В случае ошибки просто используем данные из URL
          setFormData((prev) => ({
            ...prev,
            firstName: tgData.firstName || prev.firstName,
            telegramNick: tgData.userName || prev.telegramNick,
            phone: tgData.phone || prev.phone,
            tariff: newUtmParams.utm_tickettype || prev.tariff,
          }));
        }
      } else {
        // Если данных Telegram нет, заполняем только из UTM
        setFormData((prev) => ({
          ...prev,
          tariff: newUtmParams.utm_tickettype || prev.tariff,
        }));
      }
      setIsLoading(false); // Завершаем состояние загрузки
    };

    checkAndFillUserData();
  }, []); // Запускаем эффект только при монтировании

  const calculateTotal = () => {
    if (utmParams.utm_totalamount) {
      return parseFloat(utmParams.utm_totalamount);
    }
    const selected = tariffs.find((t) => t.name === formData.tariff);
    if (!selected) return 0;
    // ... (остальная логика расчёта стоимости)
    let price = selected.price;
    const tariffName = selected.name.toLowerCase();
    const promoCode = formData.promoCode.toUpperCase();

    // 1. Применяем логику UTM-меток
    if (utmParams.utm_medium === "startubhub") {
      if (tariffName === "premium") price = 1720;
      if (tariffName === "luxe") price = 4700;
    }

    const isDiscount =
      utmParams.utm_medium === "discount" &&
      ["luxe", "premium"].includes(tariffName);
    if (isDiscount) price *= 0.9;

    const isGoldAsLast =
      utmParams.utm_medium === "goldAsLast" && tariffName === "gold";
    if (isGoldAsLast) {
      const last = tariffs.find((t) => t.name.toLowerCase() === "last minute");
      if (last) price = last.price;
    }

    // 2. Применяем логику промокодов
    if (promoCode === "WOMENKOD") {
      price = Math.round(price * 0.9);
    } else if (promoCode === "WOMENKOD2025") {
      price = Math.max(0, price - 20);
    } else if (promoCode === "AGIBALOVA10") {
      price = Math.max(0, price - 10);
    } else if (promoCode === "ARINA10") {
      price = Math.round(price * 0.9);
    } else if (promoCode === "WOMAN10") {
      price = Math.max(0, price - 10);
    }

    return Math.round(price * formData.quantity);
  };

  const checkPromoCode = () => {
    const promoCode = formData.promoCode.toUpperCase();
    if (promoCode === "WOMENKOD") {
      setPromoMessage("Промокод WOMENKOD застосовано (-10%)");
    } else if (promoCode === "WOMENKOD2025") {
      setPromoMessage("Промокод WOMENKOD2025 застосовано (-20€)");
    } else if (promoCode === "AGIBALOVA10") {
      setPromoMessage("Промокод AGIBALOVA10 застосовано (-10€)");
    } else if (promoCode === "ARINA10") {
      setPromoMessage("Промокод ARINA10 застосовано (-10%)");
    } else if (promoCode === "WOMAN10") {
      setPromoMessage("Промокод WOMAN10 застосовано (-10€)");
    } else if (promoCode) {
      setPromoMessage("Промокод недійсний");
    } else {
      setPromoMessage(null);
    }
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    if (id === "promoCode") {
      checkPromoCode();
    }
  };

  const handleQuantityChange = (delta) => {
    if (utmParams.utm_totalamount) return;
    setFormData((prev) => ({
      ...prev,
      quantity: Math.max(1, prev.quantity + delta),
    }));
  };

  const handleSelectTariff = (name) => {
    if (utmParams.utm_tickettype) return;
    setFormData((prev) => ({ ...prev, tariff: name }));
    setDropdownOpen(false);
  };

  const isFormValid = () => {
    return (
      formData.firstName.trim() !== "" &&
      formData.lastName.trim() !== "" &&
      formData.email.trim() !== "" &&
      formData.phone.trim() !== "" &&
      formData.telegramNick.trim() !== "" &&
      formData.tariff.trim() !== "" &&
      formData.quantity > 0
    );
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!isFormValid()) {
    alert("Будь ласка, заповніть усі обов'язкові поля.");
    return;
  }

  const cleanTelegramNick = formData.telegramNick.startsWith("@")
    ? formData.telegramNick.substring(1)
    : formData.telegramNick;

  const selectedTariff = tariffs.find((t) => t.name === formData.tariff);
  const originalPrice = selectedTariff.price * formData.quantity;

  try {
    // ИСПРАВЛЕННЫЙ ПЕЙЛОАД: все поля теперь на верхнем уровне
    const payload = {
      fullName: {
        firstName: formData.firstName,
        lastName: formData.lastName,
      },
      phoneNumber: formData.phone,
      email: formData.email.toLowerCase(),
      telegram: {
        id: telegramData.id || "",
        userName: cleanTelegramNick || "",
        firstName: telegramData.firstName || "",
        languageCode: telegramData.languageCode || "",
        phone: telegramData.phone || "",
        isPremium: telegramData.isPremium || false,
        source: [],
        transitions: [],
      },
      sexIQ: [],
      conferences: [
        {
          conference: utmParams.utm_conference || "prahakod",
          type: "offline",
          ticketType: formData.tariff,
          ticketsQuantity: formData.quantity,
          totalAmount: calculateTotal(),
          originalAmount: originalPrice,
          takeBrunch: formData.takeBrunch,
          paymentData: {
            invoiceId: "",
            status: "pending",
          },
          promoCode: formData.promoCode || "",
          utmMarks: [
            {
              source: utmParams.utm_source || "",
              medium: utmParams.utm_medium || "",
              campaign: utmParams.utm_campaign || "",
            },
          ],
        },
      ],
      utm: {
        source: utmParams.utm_source || "",
        medium: utmParams.utm_medium || "",
        campaign: utmParams.utm_campaign || "",
      },
    };

    const response = await axios.post("/api/create-payment", payload);

    if (response.data.pageUrl) {
      window.location.href = response.data.pageUrl;
    } else {
      console.error(
        "Не вдалося отримати посилання на оплату від Monobank:",
        response.data
      );
      alert("Виникла помилка. Будь ласка, спробуйте ще раз.");
    }
  } catch (error) {
    console.error("Помилка при створенні платежу:", error);
    alert(
      "Виникла помилка при створенні платежу. Будь ласка, спробуйте ще раз."
    );
  }
};

  if (isLoading) {
    return (
      <div className={styles.modalTicketsForm}>
        <div className={styles.modalTicketsFormContent}>
          <p>Завантаження даних...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalTicketsForm}>
      <div className={styles.modalTicketsFormContent}>
        <h2 className={styles.titleTicketsForm}>придбати квиток</h2>

        <form className={styles.TicketsForm} onSubmit={handleSubmit}>
          <input
            id="firstName"
            type="text"
            className={styles.inputTicketsForm}
            placeholder="Ім’я"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={isFormFilled}
          />

          <input
            id="lastName"
            type="text"
            className={styles.inputTicketsForm}
            placeholder="Прізвище"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={isFormFilled}
          />
          <input
            id="email"
            type="email"
            className={styles.inputTicketsForm}
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={isFormFilled}
          />
          <input
            id="phone"
            type="tel"
            className={styles.inputTicketsForm}
            placeholder="Телефон*"
            value={formData.phone}
            onChange={handleChange}
            required
            disabled={isFormFilled}
          />
          <input
            id="telegramNick"
            type="text"
            className={styles.inputTicketsForm}
            placeholder="Нік Telegram*"
            value={formData.telegramNick}
            onChange={handleChange}
            required
            disabled={isFormFilled}
          />
          <input
            id="promoCode"
            type="text"
            className={styles.inputTicketsForm}
            placeholder="Promo Code"
            value={formData.promoCode}
            onChange={handleChange}
          />
          {promoMessage && (
            <p
              className={
                promoMessage === "Промокод недійсний"
                  ? styles.promoError
                  : styles.promoSuccess
              }
            >
              {promoMessage}
            </p>
          )}

          <p className={styles.biteForWriteTg}>
            *заповнивши ці поля у вас є можливість отримати подарунок від нас!
          </p>

          <div className={styles.dropdownWrapper}>
            <button
              type="button"
              className={styles.dropdownToggle}
              onClick={() => {
                if (!utmParams.utm_tickettype) {
                  setDropdownOpen(!dropdownOpen);
                }
              }}
              disabled={!!utmParams.utm_tickettype}
            >
              {formData.tariff || "Оберіть тариф"}
              <span>{dropdownOpen ? "▲" : "▼"}</span>
            </button>

            <ul
              className={`${styles.dropdownList} ${
                dropdownOpen ? styles.open : ""
              }`}
            >
              {tariffs.map((t) => {
                const tariffName = t.name.toLowerCase();
                let displayPrice = t.price;
                let originalPrice = t.price;
                let label = "";
                const promoCode = formData.promoCode.toUpperCase();
                let hasPromo = false;

                if (promoCode === "WOMENKOD2025") {
                  displayPrice = Math.max(0, t.price - 20);
                  hasPromo = true;
                } else if (promoCode === "AGIBALOVA10") {
                  displayPrice = Math.max(0, t.price - 10);
                  hasPromo = true;
                } else if (promoCode === "ARINA10") {
                  displayPrice = Math.round(t.price * 0.9);
                  hasPromo = true;
                } else if (promoCode === "WOMAN10") {
                  displayPrice = Math.max(0, t.price - 10);
                  hasPromo = true;
                }

                if (utmParams.utm_medium === "startubhub") {
                  if (tariffName === "premium") {
                    displayPrice = 1720;
                    label = "спецціна";
                  }
                  if (tariffName === "luxe") {
                    displayPrice = 4700;
                    label = "спецціна";
                  }
                }

                const isDiscount =
                  utmParams.utm_medium === "discount" &&
                  ["luxe", "premium"].includes(tariffName);
                if (isDiscount) {
                  displayPrice = Math.round(t.price * 0.9);
                  label = "−10%";
                }

                const isGoldAsLast =
                  utmParams.utm_medium === "goldAsLast" &&
                  tariffName === "gold";
                if (isGoldAsLast) {
                  displayPrice = tariffs.find(
                    (x) => x.name.toLowerCase() === "last minute"
                  )?.price;
                  label = "спецціна";
                }

                return (
                  <li
                    key={t.name}
                    className={styles.dropdownItem}
                    onClick={() => handleSelectTariff(t.name)}
                  >
                    <span>
                      {t.name}
                      {label && (
                        <span className={styles.discountLabel}> ({label})</span>
                      )}
                    </span>
                    <span>
                      {hasPromo ? (
                        <>
                          <span className={styles.oldPrice}>
                            {originalPrice}€
                          </span>{" "}
                          <span className={styles.newPrice}>
                            {displayPrice}€
                          </span>
                        </>
                      ) : displayPrice !== t.price ? (
                        <>
                          <span className={styles.oldPrice}>{t.price}€</span>{" "}
                          <span className={styles.newPrice}>
                            {displayPrice}€
                          </span>
                        </>
                      ) : (
                        <span className={styles.newPrice}>{t.price} €</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className={styles.ticketCounter}>
            <span>Кількість квитків:</span>
            <div className={styles.counterControls}>
              <button
                className={styles.plusminusBtn}
                type="button"
                onClick={() => handleQuantityChange(-1)}
                disabled={formData.quantity <= 1 || !!utmParams.utm_totalamount}
              >
                –
              </button>
              <span>{formData.quantity}</span>
              <button
                className={styles.plusminusBtn}
                type="button"
                onClick={() => handleQuantityChange(1)}
                disabled={!!utmParams.utm_totalamount}
              >
                +
              </button>
            </div>
          </div>

          <p className={styles.SumForTickets}>
            сума до сплати: {calculateTotal()} €
          </p>

          <button
            className={
              isFormValid()
                ? styles.sendBtnTicketsForm
                : `${styles.sendBtnTicketsForm} ${styles.sendBtnTicketsFormNoValid}`
            }
            type="submit"
            disabled={!isFormValid()}
          >
            перейти до оплати
          </button>
        </form>
      </div>
    </div>
  );
}

# DEPLOY
# VITE_API_URL=https://ourforms.women.place/api
# VITE_FE_URL=https://ourforms.women.place

# # DEV MODE
VITE_API_URL=http://127.1.5.232:3000/api
VITE_FE_URL=http://localhost:5173

// src/api/api.js

import axios from "axios";

class ApiClient {
  axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  constructor() {}

  handleError(error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(
          `API Error: ${error.response.status} - ${JSON.stringify(
            error.response.data
          )}`
        );
      }
      if (error.request) {
        throw new Error("API Error: No response received from server");
      }
      throw new Error(`API Error: ${error.message}`);
    } else if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(String(error));
    }
  }

  // Новый метод для поиска пользователя по Telegram ID или нику
  async findUserByTelegram(telegramId, telegramUserName) {
    try {
      // ИЗМЕНЯЕМ ПУТЬ ЗАПРОСА
      const { data } = await this.axiosInstance.post(
        "/unifiedusers/find-unified-user",
        {
          telegramId,
          telegramUserName,
        }
      );
      return data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      this.handleError(error);
    }
  }

  async createUnifiedUser(payload) {
    const { data } = await this.axiosInstance.post("/unifiedusers", payload);
    return data;
  }

  async createSpeakerApplication(payload) {
    const { data } = await this.axiosInstance.post("/speakers", payload);
    return data.data;
  }

  async createHelperUserFormApplication(payload) {
    const { data } = await this.axiosInstance.post("/helperusers", payload);
    return data.data;
  }

  async createPartnerApplication(payload) {
    const { data } = await this.axiosInstance.post("/partners", payload);
    return data.data;
  }

  async createPayment(payload) {
    const { data } = await this.axiosInstance.post("/create-payment", payload);
    return data;
  }

  async submitHelperUserFormApplication(formData) {
    try {
      const { data } = await this.axiosInstance.post(
        "/submit-helper-form",
        formData
      );
      return data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getunifieduserById(id) {
    const { data } = await this.axiosInstance.get(`/unifiedusers/${id}`);
    return data;
  }

  async getSpecificConference(unifieduserId, conferenceId) {
    const { data } = await this.axiosInstance.get(
      `/unifiedusers/${unifieduserId}/conferences/${conferenceId}`
    );
    return data;
  }

  async sendTicketOnMailByunifieduserId(id) {
    const { data } = await this.axiosInstance.post(
      `/unifiedusers/sendTicket/${id}`
    );
    return data;
  }

  async checkPromoCode(code) {
    try {
      const { data } = await this.axiosInstance.get(`/promo/${code}`);
      return data;
    } catch (error) {
      this.handleError(error);
    }
  }
}

const api = new ApiClient();

export default api;

import createHttpError from "http-errors";
import { unifiedusersCollection } from "../db/models/unifiedusers.js";

export const upsertunifieduser = async (payload) => {
  console.log("--- upsertunifieduser START ---");
  console.log(
    "Payload received in upsertunifieduser:",
    JSON.stringify(payload, null, 2)
  );

  const {
    fullName,
    phoneNumber,
    email,
    telegram,
    conferences = [],
    sexIQ = [],
    utm,
  } = payload;

  const searchQuery = { $or: [] };

  if (email && email.trim() !== "") {
    searchQuery.$or.push({ email: email.toLowerCase() });
  }
  if (phoneNumber && phoneNumber.trim() !== "") {
    searchQuery.$or.push({ phoneNumber: phoneNumber });
  }
  if (telegram && telegram.userName && telegram.userName.trim() !== "") {
    searchQuery.$or.push({ "telegram.userName": telegram.userName });
  }
  if (telegram && telegram.id && telegram.id.trim() !== "") {
    searchQuery.$or.push({ "telegram.id": telegram.id });
  }

  let unifieduserData;
  if (searchQuery.$or.length > 0) {
    unifieduserData = await unifiedusersCollection.findOne(searchQuery);
    console.log(
      "Found user on initial search (if any):",
      unifieduserData ? unifieduserData._id : "None found"
    );
  }

  // ✅ Безопасно получаем данные из массивов payload
  const newConferenceData = conferences[0] || null;
  const newSexIQData = sexIQ[0] || null;

  let targetConferenceIndex = null;
  let targetSexIQIndex = null;
  let actionTaken = "added";

  if (unifieduserData) {
    // --- Обновляем основные данные ---
    unifieduserData.fullName = {
      firstName:
        fullName?.firstName || unifieduserData.fullName.firstName || "",
      lastName: fullName?.lastName || unifieduserData.fullName.lastName || "",
    };
    unifieduserData.phoneNumber =
      phoneNumber || unifieduserData.phoneNumber || "";
    unifieduserData.email = email || unifieduserData.email || "";

    if (telegram) {
      if (telegram.id) unifieduserData.telegram.id = telegram.id;
      if (telegram.userName)
        unifieduserData.telegram.userName = telegram.userName;
      if (telegram.firstName)
        unifieduserData.telegram.firstName = telegram.firstName;
      if (telegram.languageCode)
        unifieduserData.telegram.languageCode = telegram.languageCode;
      if (telegram.phone) unifieduserData.telegram.phone = telegram.phone;
      if (telegram.isPremium !== undefined)
        unifieduserData.telegram.isPremium = telegram.isPremium;
      if (telegram.source && telegram.source.length > 0) {
        telegram.source.forEach((src) => {
          if (!unifieduserData.telegram.source.includes(src)) {
            unifieduserData.telegram.source.push(src);
          }
        });
      }
      if (telegram.transitions && telegram.transitions.length > 0) {
        telegram.transitions.forEach((trans) => {
          const isDuplicate = unifieduserData.telegram.transitions.some(
            (existingTrans) =>
              existingTrans.date.getTime() === trans.date.getTime() &&
              existingTrans.source === trans.source
          );
          if (!isDuplicate) {
            unifieduserData.telegram.transitions.push(trans);
          }
        });
      }
    }

    // --- Логика обработки конференций (остается без изменений) ---
    if (newConferenceData) {
      let foundExistingConferenceToUpdate = false;
      for (let i = 0; i < unifieduserData.conferences.length; i++) {
        const existingConf = unifieduserData.conferences[i];
        if (
          existingConf.conference === newConferenceData.conference &&
          existingConf.paymentData?.status !== "paid"
        ) {
          unifieduserData.conferences[i] = {
            ...unifieduserData.conferences[i],
            ...newConferenceData,
          };
          targetConferenceIndex = i;
          foundExistingConferenceToUpdate = true;
          actionTaken = "updated";
          console.log(
            `Updating existing non-paid conference "${newConferenceData.conference}" for user ${unifieduserData._id} at index ${i}`
          );
          break;
        }
      }
      if (!foundExistingConferenceToUpdate) {
        unifieduserData.conferences.push(newConferenceData);
        targetConferenceIndex = unifieduserData.conferences.length - 1;
        actionTaken = "added";
        console.log(
          `Adding new conference "${newConferenceData.conference}" for user ${unifieduserData._id} at index ${targetConferenceIndex}`
        );
      }
    }

    // ✅ НОВАЯ ЛОГИКА для sexIQ: ищем неоплаченную запись, иначе добавляем новую
    if (newSexIQData) {
      let foundExistingSexIQToUpdate = false;
      for (let i = 0; i < unifieduserData.sexIQ.length; i++) {
        const existingSexIQ = unifieduserData.sexIQ[i];
        if (
          existingSexIQ.event === newSexIQData.event &&
          existingSexIQ.paymentData?.status !== "paid"
        ) {
          unifieduserData.sexIQ[i] = {
            ...existingSexIQ,
            ...newSexIQData,
          };
          targetSexIQIndex = i;
          foundExistingSexIQToUpdate = true;
          actionTaken = "updated";
          console.log(
            `Updating existing non-paid sexIQ event "${newSexIQData.event}" for user ${unifieduserData._id} at index ${i}`
          );
          break;
        }
      }
      if (!foundExistingSexIQToUpdate) {
        unifieduserData.sexIQ.push(newSexIQData);
        targetSexIQIndex = unifieduserData.sexIQ.length - 1;
        actionTaken = "added";
        console.log(
          `Adding new sexIQ event "${newSexIQData.event}" for user ${unifieduserData._id} at index ${targetSexIQIndex}`
        );
      }
    }

    await unifieduserData.save();
    console.log(`Existing user ${actionTaken}:`, unifieduserData._id);
  } else {
    // --- Создаём нового пользователя ---
    const newUserData = {
      fullName,
      phoneNumber,
      email,
      telegram,
      conferences: newConferenceData ? [newConferenceData] : [],
      sexIQ: newSexIQData ? [newSexIQData] : [],
      utm,
    };
    unifieduserData = await unifiedusersCollection.create(newUserData);
    targetConferenceIndex = newConferenceData ? 0 : null;
    targetSexIQIndex = newSexIQData ? 0 : null;
    console.log("New user created:", unifieduserData._id);
  }

  console.log(
    "Final unified user data AFTER upsert:",
    JSON.stringify(unifieduserData, null, 2)
  );
  console.log("--- upsertunifieduser END ---");

  return {
    unifieduser: unifieduserData,
    conferenceIndex: targetConferenceIndex,
    sexIQIndex: targetSexIQIndex, // ✅ Возвращаем индекс для sexIQ
  };
};

export const getunifieduserById = async (id) => {
  if (!id) {
    throw createHttpError(400, "unifieduser ID is required");
  }
  const unifieduserData = await unifiedusersCollection.findById(id);
  if (!unifieduserData) {
    throw createHttpError(404, `unifieduser with id ${id} not found`);
  }
  return unifieduserData;
};

export const getAllunifiedusers = async () => {
  const unifiedusersData = await unifiedusersCollection.find();
  return unifiedusersData;
};

export const updateunifieduserById = async (unifieduserId, updatePayload) => {
  const updatedunifieduser = await unifiedusersCollection.findByIdAndUpdate(
    unifieduserId,
    updatePayload,
    { new: true }
  );

  if (!updatedunifieduser) {
    throw createHttpError(
      404,
      `unifieduser with id ${unifieduserId} not found`
    );
  }

  return updatedunifieduser;
};

import { Router } from "express";
import createHttpError from "http-errors";
import { ctrlWrapper } from "../utils/ctrlWrapper.js";
import {
  createunifieduserController,
  getAllunifiedusersController,
  getunifieduserByIdController,
  sendTicketToUserController,
} from "../controllers/unifiedusers.js";
import { validateBody } from "../middlewares/validateBody.js";
import { createunifieduserSchema } from "../validation/unifiedusers.js";
import { unifiedusersCollection } from "../db/models/unifiedusers.js";

const router = Router();

router.get(
  "/:unifieduserId/conferences/:conferenceId",
  async (req, res, next) => {
    try {
      const { unifieduserId, conferenceId } = req.params;

      const user = await unifiedusersCollection.findById(unifieduserId);

      if (!user) {
        throw createHttpError(404, `User with id ${unifieduserId} not found`);
      }

      // Mongoose метод .id() для поиска в поддокументах по их _id
      const conference = user.conferences.id(conferenceId);

      if (!conference) {
        throw createHttpError(
          404,
          `Conference with id ${conferenceId} not found for user ${unifieduserId}`
        );
      }

      res.status(200).json(conference);
    } catch (error) {
      console.error("Error fetching specific conference:", error);
      next(error);
    }
  }
);

router.get("/", ctrlWrapper(getAllunifiedusersController));

router.get("/:id", ctrlWrapper(getunifieduserByIdController));

router.post(
  "/", // Было "/unifiedusers"
  validateBody(createunifieduserSchema),
  ctrlWrapper(createunifieduserController)
);

router.post(
  "/sendTicket/:id", // Было "/unifiedusers/sendTicket/:id"
  ctrlWrapper(sendTicketToUserController)
);

// НОВЫЙ РОУТ ДЛЯ ПОИСКА ПОЛЬЗОВАТЕЛЯ ПО TELEGRAM-ДАННЫМ
router.post("/find-unified-user", async (req, res, next) => {
  try {
    const { telegramId, telegramUserName } = req.body;

    const searchQuery = { $or: [] };

    if (telegramId && telegramId.trim() !== "") {
      searchQuery.$or.push({ "telegram.id": telegramId });
    }
    if (telegramUserName && telegramUserName.trim() !== "") {
      searchQuery.$or.push({ "telegram.userName": telegramUserName });
    }

    if (searchQuery.$or.length === 0) {
      // Возвращаем 400 Bad Request, если нет данных для поиска
      return res.status(400).json({ message: "Необходимо указать telegramId или telegramUserName" });
    }

    const user = await unifiedusersCollection.findOne(searchQuery);

    if (!user) {
      // Возвращаем 404 Not Found, если пользователь не найден
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Если пользователь найден, отправляем его данные
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

export default router;

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
    sexIQ: [
      {
        event: { type: String, default: "" },
        type: { type: String, enum: ["online", "offline"] },
        ticketType: { type: String, default: "" },
        totalAmount: { type: Number, default: 0 },
        // ✅ Додано 'paymentData' для відповідності схемі, навіть якщо ви не надсилаєте його.
        paymentData: {
          invoiceId: String,
          status: {
            type: String,
            enum: ["pending", "paid", "failed"],
            default: "failed",
          },
        },
      },
    ],
    conferences: [
      {
        conference: { type: String, default: "" }, // Название конференции или встречи
        type: { type: String, enum: ["online", "offline"], default: "" }, // Онлайн или офлайн встреча
        ticketType: { type: String, default: "" }, // Тип билета или тарифа
        ticketsQuantity: { type: Number, default: "" }, // Количество билетов или мест на мероприятие
        totalAmount: { type: Number, default: 0 }, // Общая сумма потраченная на покупку мест или билетов
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

import { unifiedusersCollection } from "../db/models/unifiedusers.js"; // Убедитесь, что путь верный
import {
  // createunifieduser, // Эту функцию мы больше не используем напрямую
  upsertunifieduser, // Теперь импортируем новую функцию
  getAllunifiedusers,
  getunifieduserById,
} from "../services/unifiedusers.js"; // Убедитесь, что путь верный
import { sendTicket } from "../utils/sendTicket.js"; // Убедитесь, что путь верный

// Мы переименовали createunifieduser в upsertunifieduser в сервисе.
// Теперь этот контроллер должен вызывать upsertunifieduser.
export const createunifieduserController = async (req, res, next) => {
  // Добавлен next для передачи ошибок
  const payload = req.body;

  try {
    // Вся логика "проверки, существует ли запись" теперь внутри upsertunifieduser сервиса.
    // Просто вызываем ее, и она либо найдет, либо создаст пользователя.
    const unifieduser = await upsertunifieduser(payload);

    // В зависимости от того, что вернул upsertunifieduser (создание или обновление),
    // можно вернуть соответствующий статус. Сейчас всегда 201, что нормально для upsert.
    res.status(201).json({
      status: 201,
      message: "Successfully processed unifieduser (created or updated)!",
      data: unifieduser,
    });
  } catch (error) {
    // Используем next для передачи ошибки в централизованный errorHandler
    next(error);
  }
};

export const getAllunifiedusersController = async (req, res, next) => {
  // Добавлен next
  try {
    const unifieduser = await getAllunifiedusers();
    res.status(200).json({
      status: 200,
      message: "Unifiedusers were successfully found!",
      data: unifieduser,
    });
  } catch (error) {
    next(error);
  }
};

export const getunifieduserByIdController = async (req, res, next) => {
  // Добавлен next
  try {
    const unifieduser = await getunifieduserById(req.params.id);
    res.status(200).json({
      status: 200,
      message: "Unifieduser was successfully found!",
      data: unifieduser,
    });
  } catch (error) {
    next(error);
  }
};

export const sendTicketToUserController = async (req, res, next) => {
  // Добавлен next
  try {
    const unifieduser = await unifiedusersCollection.findById(req.params.id);

    if (!unifieduser) {
      // Если пользователь не найден, возвращаем 404
      return res.status(404).json({
        status: 404,
        message: "Unifieduser not found!",
      });
    }

    // ВНИМАНИЕ: Здесь у вас используется `unifieduser.purchase.tariffs[0]`.
    // Мы изменили структуру на `conferences`.
    // Если вам нужен тариф из ПОСЛЕДНЕЙ конференции, это будет `unifieduser.conferences[unifieduser.conferences.length - 1].ticketType`.
    // Если вам нужен тариф из какой-то конкретной конференции (например, той, для которой отправляется билет),
    // вам нужно будет передать в этот эндпоинт не только ID пользователя, но и ID конкретной конференции
    // или invoiceId, чтобы найти ее.
    // Для простоты, если предполагается, что билет отправляется для последней добавленной конференции:
    const lastConference =
      unifieduser.conferences[unifieduser.conferences.length - 1];
    if (!lastConference || !lastConference.ticketType) {
      return res.status(400).json({
        status: 400,
        message:
          "No conference or ticketType found for this user to send a ticket.",
      });
    }

    const ticketName = lastConference.ticketType.toLowerCase() + "Ticket"; // Исправлено на новую структуру
    const response = await sendTicket(unifieduser, ticketName); // sendTicket должен уметь работать с новой структурой unifieduser

    res.status(200).json({
      status: 200,
      message: "Ticket was successfully sent!",
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

import { Router } from "express";
import createHttpError from "http-errors";
import { ctrlWrapper } from "../utils/ctrlWrapper.js";
import {
  createunifieduserController,
  getAllunifiedusersController,
  getunifieduserByIdController,
  sendTicketToUserController,
} from "../controllers/unifiedusers.js";
import { validateBody } from "../middlewares/validateBody.js";
import { createunifieduserSchema } from "../validation/unifiedusers.js";
import { unifiedusersCollection } from "../db/models/unifiedusers.js";

const router = Router();

router.get(
  "/:unifieduserId/conferences/:conferenceId",
  async (req, res, next) => {
    try {
      const { unifieduserId, conferenceId } = req.params;

      const user = await unifiedusersCollection.findById(unifieduserId);

      if (!user) {
        throw createHttpError(404, `User with id ${unifieduserId} not found`);
      }

      // Mongoose метод .id() для поиска в поддокументах по их _id
      const conference = user.conferences.id(conferenceId);

      if (!conference) {
        throw createHttpError(
          404,
          `Conference with id ${conferenceId} not found for user ${unifieduserId}`
        );
      }

      res.status(200).json(conference);
    } catch (error) {
      console.error("Error fetching specific conference:", error);
      next(error);
    }
  }
);

router.get("/", ctrlWrapper(getAllunifiedusersController));

router.get("/:id", ctrlWrapper(getunifieduserByIdController));

router.post(
  "/", // Было "/unifiedusers"
  validateBody(createunifieduserSchema),
  ctrlWrapper(createunifieduserController)
);

router.post(
  "/sendTicket/:id", // Было "/unifiedusers/sendTicket/:id"
  ctrlWrapper(sendTicketToUserController)
);

// НОВЫЙ РОУТ ДЛЯ ПОИСКА ПОЛЬЗОВАТЕЛЯ ПО TELEGRAM-ДАННЫМ
router.post("/find-unified-user", async (req, res, next) => {
  try {
    const { telegramId, telegramUserName } = req.body;

    const searchQuery = { $or: [] };

    if (telegramId && telegramId.trim() !== "") {
      searchQuery.$or.push({ "telegram.id": telegramId });
    }
    if (telegramUserName && telegramUserName.trim() !== "") {
      searchQuery.$or.push({ "telegram.userName": telegramUserName });
    }

    if (searchQuery.$or.length === 0) {
      // Возвращаем 400 Bad Request, если нет данных для поиска
      return res.status(400).json({ message: "Необходимо указать telegramId или telegramUserName" });
    }

    const user = await unifiedusersCollection.findOne(searchQuery);

    if (!user) {
      // Возвращаем 404 Not Found, если пользователь не найден
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Если пользователь найден, отправляем его данные
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

export default router;
