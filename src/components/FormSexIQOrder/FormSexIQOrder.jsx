import styles from "./FormSexIQOrder.module.css";
import { useState, useEffect } from "react";
import SexIQIMG from "./SexIQIMG.webp";
import api from "../../api/api.js"; // Убедись, что путь правильный

export default function FormSexIQOrder() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
      telegramNick: "",
    moreInfo: ""
  });

  const [utmParams, setUtmParams] = useState({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUtmParams({
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
    });
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
      formData.email.trim() &&
      formData.phone.trim()
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

  const payload = {
    fullName: {
      // ⚠️ Эти поля должны быть на верхнем уровне
      firstName: formData.firstName || "",
      lastName: formData.lastName || "",
    },
    phoneNumber: formData.phone || "",
    email: formData.email.toLowerCase() || "",
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
        ivent: "ORDERSexIQ",
        type: "online",
        ticketType: "ORDER",
        totalAmount: 0,
      },
    ],
  };

   try {
     await api.createUnifiedUser(payload);

     alert("Анкету успішно надіслано! З вами зв'яжеться команда ❤️");
     setFormData({
       firstName: "",
       lastName: "",
       email: "",
       phone: "",
       telegramNick: "",
       moreInfo: "",
     });
   } catch (error) {
     console.error("Помилка при збереженні анкети:", error);
     alert("Виникла помилка. Спробуйте ще раз.");
   }
 };
    
    const handleTextareaChange = (e) => {
      const textarea = e.target;
      textarea.style.height = "auto"; // сброс, чтобы корректно считать scrollHeight
      textarea.style.height = textarea.scrollHeight + "px"; // подгон под контент

      handleChange(e); // твоя логика обновления formData
    };


  return (
    <section className={styles.FormSexIQSection}>
      <img src={SexIQIMG} className={styles.SexIQIMG} alt="" />
      <div className={styles.container}>
        <h1 className={styles.title}>Анкета передзапису “Sex IQ”</h1>
        <p className={styles.text1}>Привіт, мої любі жінки та дівчата!</p>
        <p className={styles.text2}>
          Вже скоро стартує моя навчальна програма «Sex IQ», де я допоможу
          кожній з вас розкрити свою сексуальність та проявлятися у світ, а
          відповідно і досягати своїх цілей через розблокування своєї енергії ❤️
        </p>
        <p className={styles.text3}>
          <span>Під час навчання ти:</span>
        </p>
        <ul className={styles.wrapperList}>
          <li>
            <p className={styles.text}>
              ✅ Знайдеш контакт з собою та зрозумієш свої справжні потреби не
              лише в сексуальному плані, а й в усіх сферах життя — навіть якщо
              зараз в тебе немає ресурсу на дослідження себе;
            </p>
          </li>
          <li>
            <p className={styles.text}>
              ✅ Прибереш навʼязані установки з твоєї голови та почнеш проявляти
              себе в світ так, як хочеш ти, а не як диктує твоє оточення;
            </p>
          </li>
          <li>
            <p className={styles.text}>
              ✅ Дозволиш собі фантазувати без почуття провини та сорому;
            </p>
          </li>
          <li>
            <p className={styles.text}>
              ✅ Перестанеш терпіти, симулювати та мовчати про свої потреби,
              навчишся відкрито говорити про свої бажання без страху бути
              висміяною;
            </p>
          </li>
          <li>
            <p className={styles.text}>
              ✅ Навчишся дивитися на себе та своє тіло не через призму
              самокритики, а з любов'ю та бажанням;
            </p>
          </li>
          <li>
            <p className={styles.text}>
              ✅ Побудуєш персональну систему дисципліни, яка перетворить твої
              наміри та бажання в конкретні результати;
            </p>
          </li>
          <li>
            <p className={styles.text}>
              ✅ Розкриєш усі канали сприйняття світу, навчишся керувати
              сексуальною енергією та інтуїцією як практичними інструментами;
            </p>
          </li>
          <li>
            <p className={styles.text}>
              ✅ Усвідомиш свій справжній потенціал та побудуєшцілісний образ
              жінки, яка використовує свої можливості на повну і не вибачається
              за свої бажання;
            </p>
          </li>
          <li>
            <p className={styles.text}>
              ✅ Створиш оптимальний життєвий ритм, що підтримує твою енергію та
              ефективність довгостроково, та дає сили на досягнення твоїх цілей.
            </p>
          </li>
        </ul>
        <p className={styles.text4}>
          Заповнення цієї анкети ні до чого не зобовʼязує, а лише дає можливість
          потрапити на мою програму за найкращими цінами передзапису — в блозі
          ціни будуть вищі.
        </p>
        <p className={styles.text5}>
          <span>
            Одразу після заповнення із тобою звʼяжеться моя команда і розкаже
            всю інформацію про навчання❤️
          </span>
        </p>
      </div>
      <form className={styles.mainForm} onSubmit={handleSubmit}>
        <input
          id="firstName"
          type="text"
          placeholder="Ім’я*"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
        <input
          id="lastName"
          type="text"
          placeholder="Прізвище*"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
        <input
          id="email"
          type="email"
          placeholder="Email*"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <input
          id="phone"
          type="tel"
          placeholder="Телефон*"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        <input
          id="telegramNick"
          type="text"
          placeholder="Telegram"
          value={formData.telegramNick}
          onChange={handleChange}
        />
        <div className={styles.wrapperTextArea}>
          <p className={styles.text}>
            Коротко опишіть свій поточний запит в житті — що вас хвилює та не
            дає проживати своє життя на повну?
          </p>
          <textarea
            id="moreInfo"
            className={styles.textArea}
            value={formData.moreInfo}
            onChange={handleTextareaChange}
            maxLength={400}
            required
          />
        </div>
        <button
          type="submit"
          disabled={!isFormValid()}
          className={
            isFormValid()
              ? styles.sendBtnForm
              : `${styles.sendBtnForm} ${styles.sendBtnFormNoValid}`
          }
        >
          відправити
        </button>
      </form>
    </section>
  );
}
