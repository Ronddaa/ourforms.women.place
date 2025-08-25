import styles from './ThankUViena.module.css'
import afisha from "./afisha.png";

export default function ThankUViena() {
    return (
      <section className={styles.ThankUViena}>
        <div className={styles.wrapper}>
          <h2 className={styles.title}>
            щоб завершити реєстрацію - переходь у мій телеграм канал!
          </h2>
          <p className={styles.text}>
            Це дуже важливо, бо це буде твоїм квитком на івент!
          </p>
          <a className={styles.goToTelegram} href="#">
            перейти
          </a>
        </div>
            <img src={afisha} className={styles.image} alt="" />            
      </section>
    );
}