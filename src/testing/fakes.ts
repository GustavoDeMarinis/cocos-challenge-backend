import { faker } from "@faker-js/faker";
import { Prisma, User, Instrument, MarketData } from "@prisma/client";
import { PortfolioUser } from "../api/portfolio/portfolio";
import { InstrumentResult } from "../api/instrument/instrument";

export const getFakeUser = (partialUser: Partial<User> = {}): User => {
  return {
    id: partialUser.id || faker.number.int(),
    email: partialUser.email || faker.internet.email(),
    accountnumber: partialUser.accountnumber || faker.finance.accountNumber(),
    available_cash: new Prisma.Decimal(
      partialUser.available_cash || faker.finance.amount({ min: 1000, max: 10000 })
    ),
  };
};

export const getFakePortfolioUser = (
  partialUser: Partial<PortfolioUser> = {}
): PortfolioUser => {
  const portFolioUser: PortfolioUser = {
    available_cash: new Prisma.Decimal(
      partialUser.available_cash || faker.finance.amount({ min: 1000, max: 10000 })
    ),
    orders: partialUser.orders || [],
    positions: partialUser.positions || []
  }
  return portFolioUser;
};

export const getFakeMarketData = (
  partial: Partial<MarketData> = {}
): MarketData => {
  return {
    id: partial.id || faker.number.int(),
    instrumentid: partial.instrumentid || faker.number.int(),
    high: new Prisma.Decimal(partial.high || faker.finance.amount()),
    low: new Prisma.Decimal(partial.low || faker.finance.amount()),
    open: new Prisma.Decimal(partial.open || faker.finance.amount()),
    close: new Prisma.Decimal(partial.close || faker.finance.amount()),
    previousclose: new Prisma.Decimal(
      partial.previousclose || faker.finance.amount()
    ),
    date: partial.date || faker.date.recent(),
  };
};

export const getFakeInstrument = (
  partial: Partial<Instrument> = {}
): Instrument => {
  return {
    id: partial.id || faker.number.int(),
    ticker: partial.ticker || faker.finance.currencyCode(),
    name: partial.name || faker.commerce.productName(),
    type: partial.type || "ACCIONES",
  };
};

export type PortfolioPosition = PortfolioUser["positions"][number];

export const getFakePosition = (
  partial: Partial<PortfolioPosition> = {}
): PortfolioPosition => {
  return {
    id: partial.id || faker.number.int(),
    size: partial.size || faker.number.int({ min: 1, max: 100 }),
    average_price: new Prisma.Decimal(
      partial.average_price || faker.finance.amount()
    ),
    realized_pnl: new Prisma.Decimal(
      partial.realized_pnl || faker.finance.amount()
    ),
    total_invested: new Prisma.Decimal(
      partial.total_invested || faker.finance.amount()
    ),
    instruments: {
      ...getFakeInstrument(),
      marketdata: [getFakeMarketData()],
      ...partial.instruments,
    }
  };
};

export const getFakeInstrumentResult = (
  partial: Partial<InstrumentResult> = {}
): InstrumentResult => {
  return {
    id: partial.id || faker.number.int(),
    ticker: partial.ticker || faker.finance.currencyCode(),
    name: partial.name || faker.commerce.productName(),
    type: partial.type || "ACCIONES",
    marketdata: partial.marketdata || [
      {
        close: new Prisma.Decimal(faker.finance.amount()),
        previousclose: new Prisma.Decimal(faker.finance.amount()),
        date: faker.date.recent(),
      },
    ],
  };
};