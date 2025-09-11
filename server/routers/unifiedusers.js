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
