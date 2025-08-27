import { useEffect, useState } from "react";
import styles from "./FormSexIQ.module.css";
import axios from "axios"; // Додаємо axios для запитів

export default function FormSexIQPersonalWork() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    telegramNick: "",
    moreInfo: "",
  });

  const [utmParams, setUtmParams] = useState({}); // ✅ Новий стан для UTM-параметрів
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm_source = params.get("utm_source") || "";
    const utm_medium = params.get("utm_medium") || "";
    const utm_campaign = params.get("utm_campaign") || "";

    // ✅ Зберігаємо UTM-параметри в стані
    setUtmParams({ utm_source, utm_medium, utm_campaign });
  }, []);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const isFormValid = () => {
    return (
      formData.firstName.trim() &&
      formData.lastName.trim() &&
      formData.email.trim()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid() || isSubmitting) {
      setStatusMessage("Будь ласка, заповніть усі обов'язкові поля.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("Створення платежу, будь ласка, зачекайте...");

    const cleanTelegramNick = formData.telegramNick.startsWith("@")
      ? formData.telegramNick.substring(1)
      : formData.telegramNick;

    const payload = {
      user: {
        fullName: {
          firstName: formData.firstName || "",
          lastName: formData.lastName || "",
        },
        email: formData.email.toLowerCase() || "",
        phoneNumber: formData.phone || "",
        telegram: {
          id: "",
          userName: cleanTelegramNick || "",
          firstName: "",
          languageCode: "",
          phone: "",
          isPremium: false,
          source: [],
          transitions: [],
        },
        sexIQ: [
          {
            event: "SexIQ",
            type: "offline",
            ticketType: "Personal Working",
            totalAmount: 990,
          },
        ],
        moreInfo: formData.moreInfo || "",
        utm: utmParams, // ✅ Додаємо UTM-параметри до payload
      },
    };

    try {
      const response = await axios.post("/api/create-payment", payload);

      if (response.data.pageUrl) {
        setStatusMessage(
          "Платіж успішно створено! Перенаправлення на сторінку оплати..."
        );
        window.location.href = response.data.pageUrl;
      } else {
        setStatusMessage("Не вдалося отримати URL сторінки оплати.");
        console.error(
          "Помилка: відсутній pageUrl у відповіді сервера.",
          response.data
        );
      }
    } catch (error) {
      console.error(
        "Помилка при створенні платежу:",
        error.response?.data || error
      );
      setStatusMessage(
        "Виникла помилка під час створення платежу. Спробуйте ще раз."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.SexIQSection}>
      <form className={styles.mainForm} onSubmit={handleSubmit}>
        <h1 className={`${styles.title} ${styles.titlePersonal}`}>
          Індивідуальна робота
        </h1>
        <p className={styles.text}> з Анастасією</p>
        <p className={styles.priceText}>
          <span>5000€</span>3500€
        </p>
        <input
          className={styles.inputSexIQ}
          id="firstName"
          type="text"
          placeholder="Ім’я*"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
        <input
          className={styles.inputSexIQ}
          id="lastName"
          type="text"
          placeholder="Прізвище*"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
        <input
          className={styles.inputSexIQ}
          id="email"
          type="email"
          placeholder="Email*"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          className={styles.inputSexIQ}
          id="phone"
          type="tel"
          placeholder="Телефон*"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        <input
          className={styles.inputSexIQ}
          id="telegramNick"
          type="text"
          placeholder="Telegram"
          value={formData.telegramNick}
          onChange={handleChange}
        />
        <button
          type="submit"
          disabled={!isFormValid() || isSubmitting}
          className={
            isFormValid() && !isSubmitting
              ? styles.sendBtnForm
              : `${styles.sendBtnForm} ${styles.sendBtnFormNoValid}`
          }
        >
          {isSubmitting ? "Обробка..." : "перейти до оплати"}
        </button>
        {statusMessage && (
          <p className={styles.statusMessage}>{statusMessage}</p>
        )}
      </form>
    </section>
  );
}
