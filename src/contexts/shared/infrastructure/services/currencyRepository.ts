import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
}

export const currencyRepository = {
  getExchangeRate: async (from: string, to: string, date?: Date): Promise<ExchangeRate> => {
    const dateParam = date ? `&date=${date.toISOString().slice(0, 10)}` : "";
    return httpClient<ExchangeRate>(
      `/exchange-rate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${dateParam}`,
      { method: "GET" },
    );
  },
};
