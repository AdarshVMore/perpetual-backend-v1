import express from "express";
import type { Request, Response } from "express";
import { db } from "./utils/prisma";
import jwt from "jsonwebtoken";
import z from "zod";
import bcrypt, { hash } from "bcrypt";

const app = express();
app.use(express.json());
const JWT_SECRET = "secret";

type UserPositions = {
  market: string;
  type: string;
  qty: number;
  leverage: number;
  margin: number;
  maintainanceMargin: number;
  liquidationPrice: number;
  pnL: number;
  averagePrice: number;
  unrealisedPnL: number;
};

type UserOrders = {
  orderId: 10;
  market: string;
  type: string;
  qty: number;
  margin: number;
  leverage: number;
  orderType: string;
  price: number;
  filledQty: number;
  remainingQty: number;
  status: string;
};

type User = {
  userId: number;
  username: string;
  password: string;
  collateral: {
    available: number;
    locked: number;
  };
  position: UserPositions[];
  orders: UserOrders[];
};

const users:User = [
  {
    userId: 1,
    username: "harkirat",
    password: 123123,
    collateral: {
      availabe: 2000,
      locked: 1000,
    },
    positions: [
      {
        market: "SOL",
        type: "SHORT",
        qty: 10,
        leverage: 10,
        margin: 1000,
        maintainanceMargin: 25,
        liquidationPrice: 80,
        pnL: 200,
        averagePrice: 90,
        unrealisedPnL: 80,
      },
      {
        market: "ETH",
        type: "LONG",
        qty: 1,
        leverage: 5,
        margin: 1000,
        maintainanceMargin: 25,
        liquidationPrice: 900,
        pnL: -100,
        averagePrice: 1900,
        unrealisedPnL: 70,
      },
    ],
    orders: [
      {
        orderId: 10,
        market: "SOL",
        type: "SHORT",
        qty: 10,
        margin: 500,
        leverage: 5,
        orderType: "market",
        price: 90,
        filledQty: 5,
        remainingQty: 5,
        status: "filled",
      },
      {
        orderId: 11,
        market: "ETH",
        type: "LONG",
        qty: 10,
        margin: 500,
        leverage: 10,
        orderType: "market",
        price: 1900,
        filledQty: 5,
        remainingQty: 5,
        status: "filled",
      },
      {
        orderId: 12,
        market: "ZEC",
        type: "LONG",
        qty: 10,
        margin: 500,
        leverage: 15,
        orderType: "limit",
        price: 1900,
        filledQty: 5,
        remainingQty: 5,
        status: "open",
      },
    ],
  },
  {
    userId: 2,
    username: "raman",
    password: 123123,
    collateral: {
      availabe: 2000,
      locked: 2000,
    },
    positions: [
      {
        market: "SOL",
        type: "SHORT",
        qty: 10,
        leverage: 10,
        margin: 1000,
        maintainanceMargin: 25,
        liquidationPrice: 80,
        pnL: 200,
        averagePrice: 90,
        unrealisedPnL: 80,
      },
      {
        market: "ETH",
        type: "LONG",
        qty: 1,
        leverage: 5,
        margin: 1000,
        maintainanceMargin: 25,
        liquidationPrice: 900,
        pnL: -100,
        averagePrice: 1900,
        unrealisedPnL: 70,
      },
    ],
    orders: [
      {
        orderId: 10,
        market: "SOL",
        type: "SHORT",
        qty: 10,
        margin: 500,
        leverage: 5,
        orderType: "market",
        price: 90,
        filledQty: 5,
        remainingQty: 5,
        status: "filled",
      },
      {
        orderId: 11,
        market: "ETH",
        type: "LONG",
        qty: 10,
        margin: 500,
        leverage: 10,
        orderType: "market",
        price: 1900,
        filledQty: 5,
        remainingQty: 5,
        status: "filled",
      },
      {
        orderId: 12,
        market: "ZEC",
        type: "LONG",
        qty: 10,
        margin: 500,
        leverage: 15,
        orderType: "limit",
        price: 1900,
        filledQty: 5,
        remainingQty: 5,
        status: "open",
      },
    ],
  },
];

type BidAsk = {
  availableQty: number;
  openOrders: {
    userId: number;
    orderId: number;
    price: number;
    qty: number;
    leverage: string;
    margin: string;
    filledQty: number;
    createdAt: Date;
  }[];
};

type Orderbook = {
  bids: Record<string, BidAsk>;
  asks: Record<string, BidAsk>;
  lastTradedPrice: number;
  indexPrice: number;
};

type Orderbooks = Record<string, Orderbook>;

const orderbooks: Orderbooks = {
  SOL: { bids: {}, asks: {}, lastTradedPrice: 90, indexPrice: 90.01 },
  ETH: { bids: {}, asks: {}, lastTradedPrice: 1900, indexPrice: 1899.9 },
};

const fills = [
  {
    maker: 1,
    taker: 2,
    market: "SOL",
    qty: 10,
    price: 90,
    long: 1,
    short: 2,
  },
  {
    maker: 1,
    taker: 2,
    market: "ETH",
    qty: 1,
    price: 1900,
    long: 2,
    short: 1,
  },
];

app.post("/signup", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const userExists = await db.user.findUnique({
      where: { email: email },
    });

    if (userExists) {
      res.json({ message: "user already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = await jwt.sign({ userId: email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    if (!token) {
      console.log("token not generated");
    }
    const saveUser = await db.user.create({
      data: { email: email, password: hashedPassword },
    });
    if (saveUser) {
      res
        .status(200)
        .json({ message: "user signed up sucessfullllly!", token: token });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err });
  }
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userExists = await db.user.findUnique({ where: { email: email } });
    if (!userExists) {
      return res.json({ message: "user does not exists" });
    }

    const passwordCheck = await bcrypt.compare(password, userExists?.password);
    if (passwordCheck) {
      const token = jwt.sign({ email: email }, JWT_SECRET, { expiresIn: "7d" });
      return res.status(200).json({ message: "user signed In", token: token });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err });
  }
});

app.post("/onramp", (req, res) => {});
app.post("/order", (req, res) => {});
app.delete("/order", (req, res) => {});
app.get("/equity/available", (req, res) => {});
app.get("/positions/open/:marketId", (req, res) => {});
app.get("/positions/closed/:marketId", (req, res) => {});
app.get("/orders/open/:marketId", (req, res) => {});
app.get("/orders/:marketId", (req, res) => {});
app.get("/fills", (req, res) => {});

async function liqudationChecks(asset: string, price: number) {}

async function onPriceUpdateFromBinance(asset: string, price: number) {
  liqudationChecks(asset, price);
}

app.listen(3000, () => {
  console.log("server starteddddd at 3000!");
});
