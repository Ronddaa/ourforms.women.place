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
