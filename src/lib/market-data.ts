/**
 * Mock Market Data Layer
 * ---------------------------------------------------------------
 * Provides deterministic mock fundamentals + price series for ~30 popular tickers.
 * Used by the dashboard, ticker-search, personas, and analyst modules
 * to render realistic numbers without a live market-data API.
 *
 * All numbers are representative sample data intended for demo purposes.
 */

export interface TickerData {
  symbol: string;
  name: string;
  exchange: "NASDAQ" | "NYSE";
  sector: string;
  industry: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  volume: number; // shares
  avgVolume: number;
  marketCap: number; // USD
  peRatio: number;
  forwardPe: number;
  eps: number;
  beta: number;
  dividendYield: number; // decimal, e.g. 0.012 = 1.2%
  payoutRatio: number; // decimal
  high52: number;
  low52: number;
  revenue: number; // TTM USD
  revenueGrowthYoY: number; // decimal
  netMargin: number; // decimal
  debtToEquity: number;
  fcf: number; // free cash flow USD
  pbRatio: number;
  esgScore: number; // 0-100
  piotroskiF: number; // 0-9
  // derived history seed
  seed: number;
}

const TICKERS: TickerData[] = [
  {
    symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", sector: "Technology", industry: "Consumer Electronics",
    price: 226.4, prevClose: 224.31, change: 2.09, changePct: 0.0093, volume: 48_120_000, avgVolume: 55_300_000,
    marketCap: 3_440_000_000_000, peRatio: 34.2, forwardPe: 29.1, eps: 6.63, beta: 1.24,
    dividendYield: 0.0044, payoutRatio: 0.15, high52: 237.49, low52: 164.08, revenue: 387_000_000_000,
    revenueGrowthYoY: 0.049, netMargin: 0.263, debtToEquity: 1.51, fcf: 108_000_000_000, pbRatio: 50.4,
    esgScore: 72, piotroskiF: 8, seed: 101,
  },
  {
    symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", sector: "Technology", industry: "Software—Infrastructure",
    price: 418.27, prevClose: 415.18, change: 3.09, changePct: 0.0074, volume: 22_400_000, avgVolume: 24_100_000,
    marketCap: 3_110_000_000_000, peRatio: 35.1, forwardPe: 30.4, eps: 11.92, beta: 0.92,
    dividendYield: 0.0073, payoutRatio: 0.26, high52: 468.35, low52: 324.39, revenue: 245_000_000_000,
    revenueGrowthYoY: 0.155, netMargin: 0.364, debtToEquity: 0.32, fcf: 74_000_000_000, pbRatio: 12.1,
    esgScore: 78, piotroskiF: 8, seed: 102,
  },
  {
    symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", sector: "Communication Services", industry: "Internet Content & Information",
    price: 164.74, prevClose: 162.95, change: 1.79, changePct: 0.011, volume: 25_800_000, avgVolume: 28_200_000,
    marketCap: 2_030_000_000_000, peRatio: 24.6, forwardPe: 21.2, eps: 6.69, beta: 1.03,
    dividendYield: 0.0046, payoutRatio: 0.11, high52: 191.75, low52: 130.67, revenue: 329_000_000_000,
    revenueGrowthYoY: 0.139, netMargin: 0.256, debtToEquity: 0.10, fcf: 73_000_000_000, pbRatio: 6.1,
    esgScore: 76, piotroskiF: 7, seed: 103,
  },
  {
    symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", industry: "Internet Retail",
    price: 185.94, prevClose: 188.4, change: -2.46, changePct: -0.0131, volume: 38_900_000, avgVolume: 41_500_000,
    marketCap: 1_940_000_000_000, peRatio: 42.8, forwardPe: 31.6, eps: 4.34, beta: 1.16,
    dividendYield: 0.0, payoutRatio: 0.0, high52: 201.2, low52: 132.94, revenue: 590_000_000_000,
    revenueGrowthYoY: 0.118, netMargin: 0.083, debtToEquity: 0.62, fcf: 50_000_000_000, pbRatio: 9.2,
    esgScore: 68, piotroskiF: 7, seed: 104,
  },
  {
    symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors",
    price: 138.6, prevClose: 134.28, change: 4.32, changePct: 0.0322, volume: 218_000_000, avgVolume: 235_000_000,
    marketCap: 3_400_000_000_000, peRatio: 65.4, forwardPe: 38.7, eps: 2.12, beta: 1.65,
    dividendYield: 0.0003, payoutRatio: 0.01, high52: 140.76, low52: 47.32, revenue: 96_300_000_000,
    revenueGrowthYoY: 1.94, netMargin: 0.559, debtToEquity: 0.20, fcf: 28_000_000_000, pbRatio: 60.2,
    esgScore: 64, piotroskiF: 8, seed: 105,
  },
  {
    symbol: "META", name: "Meta Platforms, Inc.", exchange: "NASDAQ", sector: "Communication Services", industry: "Internet Content & Information",
    price: 563.2, prevClose: 558.14, change: 5.06, changePct: 0.0091, volume: 14_200_000, avgVolume: 15_700_000,
    marketCap: 1_430_000_000_000, peRatio: 27.8, forwardPe: 23.5, eps: 20.26, beta: 1.21,
    dividendYield: 0.0036, payoutRatio: 0.10, high52: 595.94, low52: 313.66, revenue: 156_000_000_000,
    revenueGrowthYoY: 0.227, netMargin: 0.349, debtToEquity: 0.30, fcf: 52_000_000_000, pbRatio: 8.4,
    esgScore: 61, piotroskiF: 8, seed: 106,
  },
  {
    symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", sector: "Consumer Cyclical", industry: "Auto Manufacturers",
    price: 248.5, prevClose: 254.66, change: -6.16, changePct: -0.0242, volume: 89_700_000, avgVolume: 95_000_000,
    marketCap: 793_000_000_000, peRatio: 71.2, forwardPe: 58.4, eps: 3.49, beta: 2.04,
    dividendYield: 0.0, payoutRatio: 0.0, high52: 299.29, low52: 138.8, revenue: 95_300_000_000,
    revenueGrowthYoY: 0.018, netMargin: 0.075, debtToEquity: 0.18, fcf: 3_600_000_000, pbRatio: 10.5,
    esgScore: 52, piotroskiF: 6, seed: 107,
  },
  {
    symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE", sector: "Financial Services", industry: "Banks—Diversified",
    price: 213.7, prevClose: 211.85, change: 1.85, changePct: 0.0087, volume: 8_900_000, avgVolume: 9_400_000,
    marketCap: 610_000_000_000, peRatio: 12.1, forwardPe: 11.3, eps: 17.66, beta: 1.10,
    dividendYield: 0.0234, payoutRatio: 0.28, high52: 225.48, low52: 142.95, revenue: 162_000_000_000,
    revenueGrowthYoY: 0.062, netMargin: 0.324, debtToEquity: 1.30, fcf: 38_000_000_000, pbRatio: 2.0,
    esgScore: 70, piotroskiF: 8, seed: 108,
  },
  {
    symbol: "V", name: "Visa Inc.", exchange: "NYSE", sector: "Financial Services", industry: "Credit Services",
    price: 282.05, prevClose: 280.5, change: 1.55, changePct: 0.0055, volume: 6_200_000, avgVolume: 6_900_000,
    marketCap: 560_000_000_000, peRatio: 30.4, forwardPe: 26.8, eps: 9.28, beta: 0.96,
    dividendYield: 0.0076, payoutRatio: 0.23, high52: 290.96, low52: 227.78, revenue: 36_400_000_000,
    revenueGrowthYoY: 0.096, netMargin: 0.541, debtToEquity: 0.51, fcf: 19_800_000_000, pbRatio: 12.3,
    esgScore: 74, piotroskiF: 9, seed: 109,
  },
  {
    symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE", sector: "Healthcare", industry: "Drug Manufacturers—General",
    price: 161.2, prevClose: 160.8, change: 0.4, changePct: 0.0025, volume: 7_100_000, avgVolume: 7_400_000,
    marketCap: 388_000_000_000, peRatio: 22.8, forwardPe: 16.2, eps: 5.41, beta: 0.54,
    dividendYield: 0.0315, payoutRatio: 0.71, high52: 168.85, low52: 143.02, revenue: 88_800_000_000,
    revenueGrowthYoY: 0.043, netMargin: 0.166, debtToEquity: 0.42, fcf: 18_400_000_000, pbRatio: 5.1,
    esgScore: 80, piotroskiF: 7, seed: 110,
  },
  {
    symbol: "WMT", name: "Walmart Inc.", exchange: "NYSE", sector: "Consumer Defensive", industry: "Discount Stores",
    price: 81.32, prevClose: 80.91, change: 0.41, changePct: 0.0051, volume: 14_500_000, avgVolume: 16_200_000,
    marketCap: 654_000_000_000, peRatio: 39.4, forwardPe: 31.2, eps: 2.06, beta: 0.51,
    dividendYield: 0.0124, payoutRatio: 0.49, high52: 83.48, low52: 55.41, revenue: 651_000_000_000,
    revenueGrowthYoY: 0.061, netMargin: 0.025, debtToEquity: 0.65, fcf: 12_400_000_000, pbRatio: 7.6,
    esgScore: 73, piotroskiF: 7, seed: 111,
  },
  {
    symbol: "PG", name: "Procter & Gamble Company", exchange: "NYSE", sector: "Consumer Defensive", industry: "Household & Personal Products",
    price: 168.42, prevClose: 167.95, change: 0.47, changePct: 0.0028, volume: 6_300_000, avgVolume: 6_800_000,
    marketCap: 396_000_000_000, peRatio: 28.1, forwardPe: 24.4, eps: 5.99, beta: 0.42,
    dividendYield: 0.0234, payoutRatio: 0.66, high52: 177.18, low52: 141.21, revenue: 84_300_000_000,
    revenueGrowthYoY: 0.042, netMargin: 0.181, debtToEquity: 0.55, fcf: 16_900_000_000, pbRatio: 7.9,
    esgScore: 77, piotroskiF: 8, seed: 112,
  },
  {
    symbol: "KO", name: "Coca-Cola Company", exchange: "NYSE", sector: "Consumer Defensive", industry: "Beverages—Non-Alcoholic",
    price: 62.18, prevClose: 61.9, change: 0.28, changePct: 0.0045, volume: 12_400_000, avgVolume: 13_100_000,
    marketCap: 268_000_000_000, peRatio: 25.7, forwardPe: 21.6, eps: 2.42, beta: 0.57,
    dividendYield: 0.0286, payoutRatio: 0.74, high52: 66.27, low52: 53.94, revenue: 47_000_000_000,
    revenueGrowthYoY: 0.031, netMargin: 0.234, debtToEquity: 1.65, fcf: 9_800_000_000, pbRatio: 10.2,
    esgScore: 75, piotroskiF: 7, seed: 113,
  },
  {
    symbol: "DIS", name: "Walt Disney Company", exchange: "NYSE", sector: "Communication Services", industry: "Entertainment",
    price: 95.84, prevClose: 94.21, change: 1.63, changePct: 0.0173, volume: 10_200_000, avgVolume: 11_500_000,
    marketCap: 173_000_000_000, peRatio: 36.4, forwardPe: 19.1, eps: 2.63, beta: 1.39,
    dividendYield: 0.0084, payoutRatio: 0.31, high52: 123.74, low52: 83.91, revenue: 91_300_000_000,
    revenueGrowthYoY: 0.031, netMargin: 0.052, debtToEquity: 0.49, fcf: 9_100_000_000, pbRatio: 2.1,
    esgScore: 66, piotroskiF: 6, seed: 114,
  },
  {
    symbol: "NFLX", name: "Netflix, Inc.", exchange: "NASDAQ", sector: "Communication Services", industry: "Entertainment",
    price: 697.42, prevClose: 685.18, change: 12.24, changePct: 0.0179, volume: 4_100_000, avgVolume: 4_800_000,
    marketCap: 298_000_000_000, peRatio: 44.2, forwardPe: 36.1, eps: 15.78, beta: 1.28,
    dividendYield: 0.0, payoutRatio: 0.0, high52: 727.65, low52: 380.31, revenue: 38_600_000_000,
    revenueGrowthYoY: 0.155, netMargin: 0.224, debtToEquity: 0.71, fcf: 6_900_000_000, pbRatio: 9.4,
    esgScore: 65, piotroskiF: 7, seed: 115,
  },
  {
    symbol: "INTC", name: "Intel Corporation", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors",
    price: 22.46, prevClose: 22.91, change: -0.45, changePct: -0.0196, volume: 38_600_000, avgVolume: 42_300_000,
    marketCap: 96_000_000_000, peRatio: 0.0, forwardPe: 18.2, eps: -0.74, beta: 1.05,
    dividendYield: 0.0162, payoutRatio: 0.0, high52: 51.30, low52: 18.91, revenue: 53_300_000_000,
    revenueGrowthYoY: -0.024, netMargin: -0.014, debtToEquity: 0.49, fcf: -8_700_000_000, pbRatio: 0.86,
    esgScore: 67, piotroskiF: 4, seed: 116,
  },
  {
    symbol: "AMD", name: "Advanced Micro Devices, Inc.", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors",
    price: 158.94, prevClose: 162.32, change: -3.38, changePct: -0.0208, volume: 48_700_000, avgVolume: 52_400_000,
    marketCap: 257_000_000_000, peRatio: 102.4, forwardPe: 38.9, eps: 1.55, beta: 1.71,
    dividendYield: 0.0, payoutRatio: 0.0, high52: 227.30, low52: 116.37, revenue: 27_100_000_000,
    revenueGrowthYoY: 0.108, netMargin: 0.092, debtToEquity: 0.07, fcf: 4_500_000_000, pbRatio: 4.5,
    esgScore: 66, piotroskiF: 7, seed: 117,
  },
  {
    symbol: "CRM", name: "Salesforce, Inc.", exchange: "NYSE", sector: "Technology", industry: "Software—Application",
    price: 272.18, prevClose: 268.5, change: 3.68, changePct: 0.0137, volume: 5_800_000, avgVolume: 6_400_000,
    marketCap: 261_000_000_000, peRatio: 47.2, forwardPe: 26.8, eps: 5.77, beta: 1.30,
    dividendYield: 0.0055, payoutRatio: 0.26, high52: 327.81, low52: 193.94, revenue: 37_900_000_000,
    revenueGrowthYoY: 0.091, netMargin: 0.137, debtToEquity: 0.20, fcf: 9_600_000_000, pbRatio: 4.4,
    esgScore: 71, piotroskiF: 8, seed: 118,
  },
  {
    symbol: "BAC", name: "Bank of America Corporation", exchange: "NYSE", sector: "Financial Services", industry: "Banks—Diversified",
    price: 41.18, prevClose: 40.95, change: 0.23, changePct: 0.0056, volume: 32_800_000, avgVolume: 35_400_000,
    marketCap: 318_000_000_000, peRatio: 13.7, forwardPe: 11.2, eps: 3.01, beta: 1.27,
    dividendYield: 0.0256, payoutRatio: 0.35, high52: 44.42, low52: 26.81, revenue: 102_000_000_000,
    revenueGrowthYoY: 0.031, netMargin: 0.283, debtToEquity: 1.10, fcf: 25_000_000_000, pbRatio: 1.3,
    esgScore: 69, piotroskiF: 7, seed: 119,
  },
  {
    symbol: "XOM", name: "Exxon Mobil Corporation", exchange: "NYSE", sector: "Energy", industry: "Oil & Gas Integrated",
    price: 118.42, prevClose: 119.05, change: -0.63, changePct: -0.0053, volume: 14_200_000, avgVolume: 15_800_000,
    marketCap: 523_000_000_000, peRatio: 14.5, forwardPe: 12.9, eps: 8.16, beta: 0.92,
    dividendYield: 0.0324, payoutRatio: 0.47, high52: 126.34, low52: 95.77, revenue: 339_000_000_000,
    revenueGrowthYoY: -0.041, netMargin: 0.104, debtToEquity: 0.21, fcf: 32_000_000_000, pbRatio: 2.3,
    esgScore: 55, piotroskiF: 7, seed: 120,
  },
  {
    symbol: "CVX", name: "Chevron Corporation", exchange: "NYSE", sector: "Energy", industry: "Oil & Gas Integrated",
    price: 148.93, prevClose: 150.21, change: -1.28, changePct: -0.0085, volume: 7_400_000, avgVolume: 8_100_000,
    marketCap: 274_000_000_000, peRatio: 14.9, forwardPe: 13.1, eps: 9.99, beta: 1.13,
    dividendYield: 0.0431, payoutRatio: 0.64, high52: 163.13, low52: 135.0, revenue: 194_000_000_000,
    revenueGrowthYoY: -0.061, netMargin: 0.085, debtToEquity: 0.23, fcf: 17_500_000_000, pbRatio: 1.9,
    esgScore: 56, piotroskiF: 7, seed: 121,
  },
  {
    symbol: "PFE", name: "Pfizer Inc.", exchange: "NYSE", sector: "Healthcare", industry: "Drug Manufacturers—General",
    price: 28.74, prevClose: 28.61, change: 0.13, changePct: 0.0045, volume: 32_100_000, avgVolume: 35_200_000,
    marketCap: 163_000_000_000, peRatio: 99.7, forwardPe: 11.8, eps: 0.29, beta: 0.62,
    dividendYield: 0.0596, payoutRatio: 5.93, high52: 31.04, low52: 24.30, revenue: 59_700_000_000,
    revenueGrowthYoY: -0.211, netMargin: 0.014, debtToEquity: 0.71, fcf: 8_400_000_000, pbRatio: 1.6,
    esgScore: 71, piotroskiF: 5, seed: 122,
  },
  {
    symbol: "MRK", name: "Merck & Co., Inc.", exchange: "NYSE", sector: "Healthcare", industry: "Drug Manufacturers—General",
    price: 102.13, prevClose: 101.7, change: 0.43, changePct: 0.0042, volume: 9_800_000, avgVolume: 10_500_000,
    marketCap: 259_000_000_000, peRatio: 22.0, forwardPe: 14.7, eps: 4.64, beta: 0.38,
    dividendYield: 0.0316, payoutRatio: 0.69, high52: 134.63, low52: 99.71, revenue: 64_200_000_000,
    revenueGrowthYoY: 0.045, netMargin: 0.205, debtToEquity: 0.68, fcf: 12_600_000_000, pbRatio: 5.0,
    esgScore: 72, piotroskiF: 7, seed: 123,
  },
  {
    symbol: "ABBV", name: "AbbVie Inc.", exchange: "NYSE", sector: "Healthcare", industry: "Drug Manufacturers—General",
    price: 196.84, prevClose: 195.21, change: 1.63, changePct: 0.0084, volume: 6_900_000, avgVolume: 7_400_000,
    marketCap: 347_000_000_000, peRatio: 64.2, forwardPe: 16.4, eps: 3.07, beta: 0.55,
    dividendYield: 0.0305, payoutRatio: 1.96, high52: 207.32, low52: 153.74, revenue: 56_500_000_000,
    revenueGrowthYoY: 0.036, netMargin: 0.131, debtToEquity: 4.42, fcf: 11_700_000_000, pbRatio: 22.0,
    esgScore: 70, piotroskiF: 6, seed: 124,
  },
  {
    symbol: "COST", name: "Costco Wholesale Corporation", exchange: "NASDAQ", sector: "Consumer Defensive", industry: "Discount Stores",
    price: 895.62, prevClose: 891.31, change: 4.31, changePct: 0.0048, volume: 1_900_000, avgVolume: 2_100_000,
    marketCap: 397_000_000_000, peRatio: 54.2, forwardPe: 47.1, eps: 16.52, beta: 0.78,
    dividendYield: 0.0050, payoutRatio: 0.27, high52: 923.83, low52: 554.67, revenue: 254_000_000_000,
    revenueGrowthYoY: 0.072, netMargin: 0.029, debtToEquity: 0.42, fcf: 6_400_000_000, pbRatio: 14.1,
    esgScore: 74, piotroskiF: 8, seed: 125,
  },
  {
    symbol: "HD", name: "Home Depot, Inc.", exchange: "NYSE", sector: "Consumer Cyclical", industry: "Home Improvement Retail",
    price: 380.15, prevClose: 378.4, change: 1.75, changePct: 0.0046, volume: 3_500_000, avgVolume: 3_800_000,
    marketCap: 377_000_000_000, peRatio: 25.0, forwardPe: 22.4, eps: 15.20, beta: 1.04,
    dividendYield: 0.0245, payoutRatio: 0.61, high52: 396.39, low52: 274.86, revenue: 152_000_000_000,
    revenueGrowthYoY: 0.001, netMargin: 0.099, debtToEquity: 4.30, fcf: 15_100_000_000, pbRatio: 31.6,
    esgScore: 72, piotroskiF: 7, seed: 126,
  },
  {
    symbol: "NKE", name: "Nike, Inc.", exchange: "NYSE", sector: "Consumer Cyclical", industry: "Footwear & Accessories",
    price: 77.21, prevClose: 78.05, change: -0.84, changePct: -0.0108, volume: 10_400_000, avgVolume: 11_200_000,
    marketCap: 114_000_000_000, peRatio: 21.4, forwardPe: 18.6, eps: 3.61, beta: 1.09,
    dividendYield: 0.0181, payoutRatio: 0.39, high52: 123.39, low52: 70.37, revenue: 51_400_000_000,
    revenueGrowthYoY: -0.014, netMargin: 0.111, debtToEquity: 0.81, fcf: 5_000_000_000, pbRatio: 7.7,
    esgScore: 68, piotroskiF: 6, seed: 127,
  },
  {
    symbol: "PYPL", name: "PayPal Holdings, Inc.", exchange: "NASDAQ", sector: "Financial Services", industry: "Credit Services",
    price: 78.84, prevClose: 80.12, change: -1.28, changePct: -0.016, volume: 9_800_000, avgVolume: 10_600_000,
    marketCap: 79_000_000_000, peRatio: 19.8, forwardPe: 13.4, eps: 3.98, beta: 1.42,
    dividendYield: 0.0, payoutRatio: 0.0, high52: 84.95, low52: 55.65, revenue: 30_400_000_000,
    revenueGrowthYoY: 0.082, netMargin: 0.157, debtToEquity: 0.51, fcf: 5_400_000_000, pbRatio: 3.6,
    esgScore: 65, piotroskiF: 7, seed: 128,
  },
  {
    symbol: "UBER", name: "Uber Technologies, Inc.", exchange: "NYSE", sector: "Technology", industry: "Software—Application",
    price: 71.43, prevClose: 70.18, change: 1.25, changePct: 0.0178, volume: 16_200_000, avgVolume: 18_400_000,
    marketCap: 150_000_000_000, peRatio: 31.2, forwardPe: 22.1, eps: 2.29, beta: 1.36,
    dividendYield: 0.0, payoutRatio: 0.0, high52: 82.83, low52: 40.18, revenue: 44_800_000_000,
    revenueGrowthYoY: 0.164, netMargin: 0.061, debtToEquity: 0.79, fcf: 4_900_000_000, pbRatio: 9.1,
    esgScore: 62, piotroskiF: 7, seed: 129,
  },
  {
    symbol: "SQ", name: "Block, Inc.", exchange: "NYSE", sector: "Technology", industry: "Software—Infrastructure",
    price: 67.85, prevClose: 69.42, change: -1.57, changePct: -0.0226, volume: 7_900_000, avgVolume: 8_400_000,
    marketCap: 42_000_000_000, peRatio: 0.0, forwardPe: 24.6, eps: -0.46, beta: 2.55,
    dividendYield: 0.0, payoutRatio: 0.0, high52: 87.52, low52: 38.85, revenue: 24_900_000_000,
    revenueGrowthYoY: 0.117, netMargin: 0.014, debtToEquity: 0.21, fcf: 1_200_000_000, pbRatio: 3.0,
    esgScore: 60, piotroskiF: 5, seed: 130,
  },
];

const tickerMap: Record<string, TickerData> = Object.fromEntries(
  TICKERS.map((t) => [t.symbol.toUpperCase(), t])
);

export function getAllTickers(): TickerData[] {
  return TICKERS;
}

export function getTickerData(symbol: string): TickerData | null {
  return tickerMap[symbol.toUpperCase()] ?? null;
}

export function searchTickers(query: string, limit = 10): TickerData[] {
  const q = query.trim().toUpperCase();
  if (!q) return TICKERS.slice(0, limit);
  return TICKERS.filter(
    (t) =>
      t.symbol.includes(q) ||
      t.name.toUpperCase().includes(q) ||
      t.sector.toUpperCase().includes(q)
  ).slice(0, limit);
}

/** Deterministic PRNG seeded by ticker.seed so prices are stable across renders. */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Generate a deterministic mock historical price series ending at `data.price`.
 * Uses a simple seeded random walk, anchored so the last point equals the
 * current price.
 */
export function getHistoricalPrices(symbol: string, days: number): number[] {
  const data = getTickerData(symbol);
  if (!data) return [];
  const rng = seededRandom(data.seed + days);
  const vol = 0.014 + (data.beta - 1) * 0.006; // higher beta → more volatile
  // walk backwards from current price
  const series: number[] = [data.price];
  for (let i = 1; i < days; i++) {
    const shock = (rng() - 0.5) * 2 * vol;
    const drift = 0.0003; // slight upward drift
    const prev = series[series.length - 1];
    series.push(prev / (1 + drift + shock));
  }
  return series.reverse();
}

/** Compute simple technical indicators from a price series. */
export interface TechnicalIndicators {
  sma50: number;
  sma200: number;
  rsi14: number;
  macd: number;
  macdSignal: number;
  macdHist: number;
  bbUpper: number;
  bbMiddle: number;
  bbLower: number;
  atr14: number;
  support: number;
  resistance: number;
  trend: "up" | "down" | "sideways";
}

export function getTechnicalIndicators(symbol: string): TechnicalIndicators {
  const prices = getHistoricalPrices(symbol, 220);
  const last = (n: number) => prices.slice(-n);
  const sma = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const sma50 = sma(last(50));
  const sma200 = sma(last(200));

  // RSI 14
  const rsiArr = last(15);
  let gains = 0, losses = 0;
  for (let i = 1; i < rsiArr.length; i++) {
    const diff = rsiArr[i] - rsiArr[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / 14;
  const avgLoss = losses / 14;
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  const rsi14 = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs);

  // MACD (12, 26, 9)
  const ema = (arr: number[], period: number) => {
    const k = 2 / (period + 1);
    let e = arr[0];
    for (let i = 1; i < arr.length; i++) e = arr[i] * k + e * (1 - k);
    return e;
  };
  const ema12 = ema(last(60), 12);
  const ema26 = ema(last(60), 26);
  const macd = ema12 - ema26;
  const macdSignal = macd * 0.9; // mock signal line
  const macdHist = macd - macdSignal;

  // Bollinger Bands (20, 2σ)
  const bbArr = last(20);
  const bbMiddle = sma(bbArr);
  const variance =
    bbArr.reduce((a, b) => a + (b - bbMiddle) ** 2, 0) / bbArr.length;
  const sd = Math.sqrt(variance);
  const bbUpper = bbMiddle + 2 * sd;
  const bbLower = bbMiddle - 2 * sd;

  // ATR (14) — using true range approximation (close-to-close)
  const trArr: number[] = [];
  for (let i = 1; i < last(15).length; i++) {
    trArr.push(Math.abs(last(15)[i] - last(15)[i - 1]));
  }
  const atr14 = sma(trArr);

  // support / resistance: min/max of last 60
  const window60 = last(60);
  const support = Math.min(...window60);
  const resistance = Math.max(...window60);

  const trend: TechnicalIndicators["trend"] =
    sma50 > sma200 * 1.01 ? "up" : sma50 < sma200 * 0.99 ? "down" : "sideways";

  return {
    sma50,
    sma200,
    rsi14,
    macd,
    macdSignal,
    macdHist,
    bbUpper,
    bbMiddle,
    bbLower,
    atr14,
    support,
    resistance,
    trend,
  };
}

export function formatCurrency(n: number, opts?: { compact?: boolean }): string {
  if (!isFinite(n)) return "—";
  if (opts?.compact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(n);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatNumber(n: number, opts?: { compact?: boolean; digits?: number }): string {
  if (!isFinite(n)) return "—";
  if (opts?.compact) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(n);
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: opts?.digits ?? 2,
  }).format(n);
}

export function formatPct(n: number, digits = 2): string {
  if (!isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)}%`;
}

export const SECTORS = Array.from(new Set(TICKERS.map((t) => t.sector))).sort();
