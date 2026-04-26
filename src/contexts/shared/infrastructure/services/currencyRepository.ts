import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
}

const formatDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const currencyRepository = {
  getExchangeRate: async (from: string, to: string, date?: Date): Promise<ExchangeRate> => {
    const dateParam = date ? `&date=${formatDateLocal(date)}` : "";
    return httpClient<ExchangeRate>(
      `/exchange-rate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${dateParam}`,
      { method: "GET" },
    );
  },
};
