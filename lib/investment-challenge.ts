export const INVESTMENT_STARTING_CASH = 100_000;
export const INVESTMENT_TRANSACTION_FEE_RATE = 0.001;
export const DEFAULT_INVESTMENT_COMPETITION_SLUG = "phronesia-investment-challenge";

export type InvestmentAssetType = "ETF" | "Stock";
export type TradeSide = "buy" | "sell";

export type InvestmentAsset = {
  symbol: string;
  name: string;
  type: InvestmentAssetType;
  theme: string;
  referencePrice: number;
};

export type InvestmentMarketStatus = {
  isOpen: boolean;
  isMarketDay: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  etDate: string;
  etTime: string;
  opensAtEt: string;
  closesAtEt: string;
  message: string;
};

export type InvestmentEducationalCard = {
  title: string;
  concept: string;
  body: string;
};

export type InvestmentAssetQuote = InvestmentAsset & {
  latestClose: number;
  priceDate: string | null;
  provider: string;
};

export const INVESTMENT_ASSETS: InvestmentAsset[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF", type: "ETF", theme: "Broad US stocks", referencePrice: 520 },
  { symbol: "QQQ", name: "Invesco QQQ ETF", type: "ETF", theme: "Large technology stocks", referencePrice: 440 },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", type: "ETF", theme: "Total US market", referencePrice: 255 },
  { symbol: "GLD", name: "SPDR Gold Shares", type: "ETF", theme: "Gold exposure", referencePrice: 215 },
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond ETF", type: "ETF", theme: "Long US bonds", referencePrice: 92 },
  { symbol: "AAPL", name: "Apple", type: "Stock", theme: "Consumer technology", referencePrice: 190 },
  { symbol: "MSFT", name: "Microsoft", type: "Stock", theme: "Software and cloud", referencePrice: 420 },
  { symbol: "NVDA", name: "NVIDIA", type: "Stock", theme: "AI chips", referencePrice: 120 },
  { symbol: "TSLA", name: "Tesla", type: "Stock", theme: "Electric vehicles", referencePrice: 180 },
  { symbol: "JPM", name: "JPMorgan Chase", type: "Stock", theme: "Banking", referencePrice: 205 },
  { symbol: "KO", name: "Coca-Cola", type: "Stock", theme: "Consumer staples", referencePrice: 62 },
  { symbol: "XOM", name: "Exxon Mobil", type: "Stock", theme: "Energy", referencePrice: 115 },
  { symbol: "AMZN", name: "Amazon", type: "Stock", theme: "E-commerce and cloud", referencePrice: 185 },
  { symbol: "META", name: "Meta Platforms", type: "Stock", theme: "Social media and AI", referencePrice: 500 },
  { symbol: "GOOGL", name: "Alphabet", type: "Stock", theme: "Search, ads, and cloud", referencePrice: 170 }
];

export const INVESTMENT_EDUCATIONAL_CARDS: InvestmentEducationalCard[] = [
  {
    title: "Stocks",
    concept: "Ownership",
    body: "A stock represents ownership in a company. Stock prices can rise when investors expect higher future profits, but they can also fall quickly when expectations change."
  },
  {
    title: "ETFs",
    concept: "Diversified baskets",
    body: "An ETF usually holds many assets in one fund. This helps students compare single-company risk with diversified market exposure."
  },
  {
    title: "Bonds",
    concept: "Lending and interest rates",
    body: "Bonds are loans to governments or companies. Bond prices and yields react strongly to interest rates, inflation, and repayment risk."
  },
  {
    title: "Diversification",
    concept: "Risk management",
    body: "Diversification means spreading a portfolio across assets. In this challenge, a full diversification score requires no single asset to exceed 20% of portfolio value."
  },
  {
    title: "Risk vs Return",
    concept: "Trade-offs",
    body: "Higher expected return usually comes with higher uncertainty. A good portfolio is judged by return, risk, drawdown control, and the reasoning behind the thesis."
  },
  {
    title: "Closing Price",
    concept: "Daily market data",
    body: "The simulation uses daily closing prices instead of tick-by-tick trading. That keeps the challenge educational and reduces noise from short-term price movements."
  },
  {
    title: "Market Hours",
    concept: "Trading session",
    body: "Orders are enabled only during regular US market hours: Monday to Friday, 9:30 AM to 4:00 PM New York time."
  },
  {
    title: "Interest Rates and Stock Prices",
    concept: "Discount rates",
    body: "Higher interest rates can pressure stock prices because borrowing is more expensive and future profits are discounted more heavily."
  },
  {
    title: "Why Trading Closes",
    concept: "Order discipline",
    body: "When the US market is closed, students can review portfolios and theses, but buy and sell orders are disabled to keep results comparable."
  }
];

export function getInvestmentAsset(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  return INVESTMENT_ASSETS.find((asset) => asset.symbol === normalized) ?? null;
}

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);
}

export function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
