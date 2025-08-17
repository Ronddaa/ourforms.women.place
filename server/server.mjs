import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import env from "./utils/env.js";
import cookieParser from "cookie-parser";
import initMongoConnection from "./db/initMongoConnection.js";
import router from "./routers/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { utmTracker } from "./middlewares/utmMarks.js";
import { createPaymentHandler, paymentCallbackHandler } from "./payment.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await initMongoConnection();

const app = express();

const allowedOrigins = [
  "https://ourforms.women.place",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.1.5.232:3000",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,POST,PUT,DELETE,PATCH",
  allowedHeaders: "Content-Type,Authorization",
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use(utmTracker);
app.use("/api", router);

// Подключаем обработчики платежей напрямую
app.post("/api/create-payment", createPaymentHandler);
app.post("/api/payment-callback", paymentCallbackHandler);

// ---------- Статика и SPA ----------
const staticFilesPath = join(__dirname, "../");

app.use(
  express.static(staticFilesPath, {
    setHeaders: (res, path) => {
      if (/\.(webp|jpg|png|gif)$/.test(path)) {
        res.setHeader("Cache-Control", "public, max-age=36000");
      }
    },
  })
);

app.get("/*", (req, res) => {
  res.sendFile(join(staticFilesPath, "index.html"));
});

app.use(errorHandler);

const PORT = env("PORT", 3000);
const HOST = env("HOST", "0.0.0.0");

app.listen(PORT, HOST, () => {
  console.log(`Сервер запущен по адресу: http://${HOST}:${PORT}`);
});
