import { useState, useEffect } from "react";
import styles from "./WomenKodTicket.module.css";
import api from "../../api/api.js";
import axios from "axios";
import back from './back.png'

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
  const [isLoading, setIsLoading] = useState(true);
  const [isFormFilled, setIsFormFilled] = useState(false);

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
    // { name: "PREMIUM", price: 450 },
    // { name: "LUXE", price: 1200 },
  ];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmTicketType = params.get("utm_tickettype");
    const formattedTicketType = utmTicketType
      ? utmTicketType.toUpperCase().replace("-", " ")
      : "";

    const newUtmParams = {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_conference: params.get("utm_conference") || "",
      utm_tickettype: formattedTicketType,
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
      if (tgData.id || tgData.userName) {
        try {
          const user = await api.findUserByTelegram(tgData.id, tgData.userName);
          if (user) {
            setFormData({
              firstName: user.fullName?.firstName || "",
              lastName: user.fullName?.lastName || "",
              email: user.email || "",
              phone: user.phoneNumber || "",
              telegramNick: user.telegram?.userName || "",
              tariff: newUtmParams.utm_tickettype || "",
              quantity: 1,
              promoCode: "",
              takeBrunch: false,
            });
            setIsFormFilled(true);
          } else {
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
          setFormData((prev) => ({
            ...prev,
            firstName: tgData.firstName || prev.firstName,
            telegramNick: tgData.userName || prev.telegramNick,
            phone: tgData.phone || prev.phone,
            tariff: newUtmParams.utm_tickettype || prev.tariff,
          }));
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          tariff: newUtmParams.utm_tickettype || prev.tariff,
        }));
      }
      setIsLoading(false);
    };
    checkAndFillUserData();
  }, []);

  const calculateTotal = () => {
    if (utmParams.utm_totalamount) {
      return parseFloat(utmParams.utm_totalamount);
    }
    const selected = tariffs.find((t) => t.name === formData.tariff);
    if (!selected) return 0;
    let price = selected.price;
    const tariffName = selected.name.toLowerCase();
    const promoCode = formData.promoCode.toUpperCase();
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
    if (promoCode === "WOMENKOD") {
      price = Math.round(price * 0.9);
    } else if (promoCode === "WOMENKOD2025") {
      price = Math.max(0, price - 20);
    } else if (promoCode === "AGIBALOVA10") {
      price = Math.max(0, price - 20);
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

    console.log("Отправка запроса на бэкенд...");
    console.log("UTM параметры:", utmParams);
    console.log("Telegram данные:", telegramData);
    console.log("Данные формы:", formData);

    try {
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
      console.log(
        "Отправляемая полезная нагрузка (payload):",
        JSON.stringify(payload, null, 2)
      );

      const response = await axios.post("/api/create-payment", {
        user: payload,
      });

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
    <section className={styles.modalTicketsForm}>
      <img src={back} alt="" className={styles.back} />
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
                          </span>
                          <span className={styles.newPrice}>
                            {displayPrice}€
                          </span>
                        </>
                      ) : displayPrice !== t.price ? (
                        <>
                          <span className={styles.oldPrice}>{t.price}€</span>
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
    </section>
  );
}
