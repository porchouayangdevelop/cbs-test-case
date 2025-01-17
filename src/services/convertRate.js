const convertRateToAmount = {
  convert: (amount, currencyFrom, currencyTo) => {
    const rates = {
      EUR: 0.85,
      USD: 1.15,
      GBP: 0.75,
      LAK: 0.00011, // Add LAK rate
    };

    if (!rates[currencyFrom] || !rates[currencyTo]) {
      throw new Error("Invalid currency code");
    }

    return (amount / rates[currencyFrom]) * rates[currencyTo];
  },
};

const convertAmountToRates = {
  convert: (amount, currencyFrom, currencyTo) => {
    const rates = {
      EUR: 0.85,
      USD: 1.15,
      GBP: 0.75,
      LAK: 0.00011, // Add LAK rate
    };

    if (!rates[currencyFrom] || !rates[currencyTo]) {
      throw new Error("Invalid currency code");
    }

    // Convert the amount to the base currency (e.g., USD) and then to the target currency
    const amountInBaseCurrency = amount * rates[currencyFrom];
    return amountInBaseCurrency / rates[currencyTo];
  },
};

export default { convertRateToAmount, convertAmountToRates };
