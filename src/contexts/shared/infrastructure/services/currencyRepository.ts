import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
}

export const currencyRepository = {
  getExchangeRate: async (from: string, to: string): Promise<ExchangeRate> => {
    return httpClient<ExchangeRate>(
      `/exchange-rate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      { method: "GET" },
    );
  },
};
