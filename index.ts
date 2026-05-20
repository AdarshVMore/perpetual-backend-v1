import type { Request, Response } from "express";
import express from "express";
import { db } from "./utils/prisma";
import jwt from "jsonwebtoken";
import z from "zod";
import bcrypt, { hash } from "bcrypt";
import { authMiddleware } from "./middleware/auth";
import axios from "axios";
import { setOriginalNode } from "typescript";

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
  orderId: string;
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
  userId: string;
  username: string;
  password: string;
  collateral: {
    availabe: number;
    locked: number;
  };
  positions: UserPositions[];
  orders: UserOrders[];
};

let users: User[] = [
  //   // Long => SOLUSDT
  //   // price : 88
  //   // qty : 5
  //   // margin: 1000
  //   // leverage: 10,
  //   {
  //     userId: "1",
  //     username: "harkirat",
  //     password: "123123",
  //     collateral: {
  //       availabe: 2000,
  //       locked: 1000,
  //     },
  //     positions: [
  //       {
  //         market: "SOLUSDT",
  //         type: "SHORT",
  //         qty: 10,
  //         leverage: 10,
  //         margin: 1000,
  //         maintainanceMargin: 25,
  //         liquidationPrice: 80,
  //         pnL: 200,
  //         averagePrice: 90,
  //         unrealisedPnL: 80,
  //       },
  //       {
  //         market: "ETHUSDT",
  //         type: "LONG",
  //         qty: 1,
  //         leverage: 5,
  //         margin: 1000,
  //         maintainanceMargin: 25,
  //         liquidationPrice: 1700,
  //         pnL: -100,
  //         averagePrice: 1900,
  //         unrealisedPnL: 70,
  //       },
  //     ],
  //     orders: [
  //       {
  //         orderId: "10",
  //         market: "SOLUSDT",
  //         type: "SHORT",
  //         qty: 10,
  //         margin: 500,
  //         leverage: 5,
  //         orderType: "market",
  //         price: 90,
  //         filledQty: 5,
  //         remainingQty: 5,
  //         status: "filled",
  //       },
  //       {
  //         orderId: "11",
  //         market: "ETHUSDT",
  //         type: "LONG",
  //         qty: 10,
  //         margin: 500,
  //         leverage: 10,
  //         orderType: "market",
  //         price: 1900,
  //         filledQty: 5,
  //         remainingQty: 5,
  //         status: "filled",
  //       },
  //       {
  //         orderId: "12",
  //         market: "ZEC",
  //         type: "LONG",
  //         qty: 10,
  //         margin: 500,
  //         leverage: 15,
  //         orderType: "limit",
  //         price: 1900,
  //         filledQty: 5,
  //         remainingQty: 5,
  //         status: "open",
  //       },
  //     ],
  //   },
  //   {
  //     userId: "2",
  //     username: "raman",
  //     password: "123123",
  //     collateral: {
  //       availabe: 2000,
  //       locked: 2000,
  //     },
  //     positions: [
  //       {
  //         market: "SOLUSDT",
  //         type: "SHORT",
  //         qty: 10,
  //         leverage: 10,
  //         margin: 1000,
  //         maintainanceMargin: 25,
  //         liquidationPrice: 100,
  //         pnL: 200,
  //         averagePrice: 90,
  //         unrealisedPnL: 80,
  //       },
  //       {
  //         market: "ETHUSDT",
  //         type: "LONG",
  //         qty: 1,
  //         leverage: 5,
  //         margin: 1000,
  //         maintainanceMargin: 25,
  //         liquidationPrice: 900,
  //         pnL: -100,
  //         averagePrice: 1900,
  //         unrealisedPnL: 70,
  //       },
  //     ],
  //     orders: [
  //       {
  //         orderId: "10",
  //         market: "SOLUSDT",
  //         type: "SHORT",
  //         qty: 10,
  //         margin: 500,
  //         leverage: 5,
  //         orderType: "market",
  //         price: 90,
  //         filledQty: 5,
  //         remainingQty: 5,
  //         status: "filled",
  //       },
  //       {
  //         orderId: "11",
  //         market: "ETHUSDT",
  //         type: "LONG",
  //         qty: 10,
  //         margin: 500,
  //         leverage: 10,
  //         orderType: "market",
  //         price: 1900,
  //         filledQty: 5,
  //         remainingQty: 5,
  //         status: "filled",
  //       },
  //       {
  //         orderId: "12",
  //         market: "ZEC",
  //         type: "LONG",
  //         qty: 10,
  //         margin: 500,
  //         leverage: 15,
  //         orderType: "limit",
  //         price: 1900,
  //         filledQty: 5,
  //         remainingQty: 5,
  //         status: "open",
  //       },
  //     ],
  //   },
];

export class Node {
  data: Order;
  next: Node | null;

  constructor(data: Order) {
    this.data = data;
    this.next = null;
  }
}

export class LinkedList {
  head: Node | null;
  tail: Node | null;
  length: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  append(data: Order) {
    const node = new Node(data);

    if (!this.head) {
      this.head = node;
      this.tail = node;
      this.length++;
      return node;
    }

    this.tail!.next = node;
    this.tail = node;
    this.length++;

    return node;
  }

  getHead() {
    return this.head;
  }

  dequeue() {
    if (!this.head) {
      return null;
    }

    const removed = this.head;

    this.head = this.head.next;

    if (!this.head) {
      this.tail = null;
    }

    this.length--;

    return removed;
  }

  deleteOrder(orderId: string) {
    if (this.head === null) {
      return;
    }
    let current = this.head;
    while (current.next !== null) {
      if (current.next.data.orderId === orderId) {
        current.next = current.next.next;
        this.length--;
        return;
      }
      current = current.next;
    }
  }

  isEmpty() {
    return this.length === 0;
  }

  getTotalQty() {
    if (!this.head) {
      return 0;
    }
    let count = 0;
    let current = this.head;
    while (current.next !== null) {
      count += current.data.qty;
      current = current.next;
    }
    return count;
  }

  getOrder(orderId: string) {
    if (!this.head) {
      throw new Error("no head");
    }
    let current = this.head;
    while (current.next !== null) {
      if (current.data.orderId === orderId) {
        return current.data;
      }
      current = current.next;
    }
    console.log("Order with ", orderId, " did not found");
  }

  getArray(data: Order) {}
}

export interface Order {
  orderId: string;
  price: number;
  qty: number;
  remainingQty: number;
  userId: string;
  market_id: string;
  status: "Opened";
  side: "BUY" | "SELL";
}

export interface SingleOrderBook {
  asks: Map<number, LinkedList>;
  bids: Map<number, LinkedList>;
  sortedBidPrices: number[];
  sortedAskPrices: number[];
  orderMap: Map<string, Node>;
  lastTradedPrice: number;
  indexPrice: number;
}

export interface OrderBooks {
  [market: string]: SingleOrderBook;
}
const orderbooks: OrderBooks = {
  SOLUSDT: {
    asks: new Map<number, LinkedList>(),
    bids: new Map<number, LinkedList>(),
    sortedAskPrices: [90, 92, 94],
    sortedBidPrices: [89, 87, 86],
    orderMap: new Map<string, Node>(),
    lastTradedPrice: 90,
    indexPrice: 90.01,
  },
  BTCUSDT: {
    asks: new Map<number, LinkedList>(),
    bids: new Map<number, LinkedList>(),
    sortedAskPrices: [],
    sortedBidPrices: [],
    orderMap: new Map<string, Node>(),
    lastTradedPrice: 90,
    indexPrice: 90.01,
  },
};

interface Fills {
  maker: string;
  taker: string;
  market: string;
  qty: number;
  price: number;
  long: number;
  short: number;
}

const fills: Fills[] = [
  //   {
  //     maker: "1",
  //     taker: "2",
  //     market: "SOLUSDT",
  //     qty: 10,
  //     price: 90,
  //     long: 1,
  //     short: 2,
  //   },
  //   {
  //     maker: "1",
  //     taker: "2",
  //     market: "ETHUSDT",
  //     qty: 1,
  //     price: 1900,
  //     long: 2,
  //     short: 1,
  //   },
];

const maintainanceMarginPercent = 5;
let liquidationPrice = 0;

function calculateLiquidationPrice(
  entryPrice: number,
  leverage: number,
  positionType: string,
) {
  let liqPrice: number;
  if (positionType === "SHORT") {
    liqPrice =
      entryPrice * (1 + 1 / leverage - maintainanceMarginPercent / 100);
  } else {
    liqPrice =
      entryPrice * (1 - 1 / leverage + maintainanceMarginPercent / 100);
  }
  return liqPrice;
}

const API_BINANCE_API_KEY = process.env.API_BINANCE_API_KEY;

async function calculateUnrealisedPnL(
  entryPrice: number,
  qty: number,
  marketId: string,
  positionType: string,
) {
  const response = await axios({
    method: "get",
    url: `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${marketId}`,
    headers: {
      "X-MBX-APIKEY": API_BINANCE_API_KEY,
    },
  });

  const priceUpdate = Number(response.data.price);

  let unrealisedPnL = 0;

  if (positionType === "LONG") {
    unrealisedPnL = (priceUpdate - entryPrice) * qty;
  } else {
    unrealisedPnL = (entryPrice - priceUpdate) * qty;
  }

  return {
    unrealisedPnL,
    priceUpdate,
  };
}

function autoLiquidate(position: UserPositions, user: User) {
  console.log(
    "auto liquidating Position for Market ",
    position.market,
    " of user ",
    user.username,
  );
}

async function updateUnRealisedPnLANDautoLiquidation() {
  if (users.length === 0) {
    return;
  }

  setInterval(async () => {
    for (let user of users) {
      for (let position of user.positions) {
        const { unrealisedPnL, priceUpdate } = await calculateUnrealisedPnL(
          position.averagePrice,
          position.qty,
          position.market,
          position.type,
        );

        position.unrealisedPnL = unrealisedPnL;

        if (position.type === "LONG") {
          if (priceUpdate <= position.liquidationPrice) {
            autoLiquidate(position, user);
          }
        } else {
          if (priceUpdate >= position.liquidationPrice) {
            autoLiquidate(position, user);
          }
        }
      }
    }
  }, 1000);
}

updateUnRealisedPnLANDautoLiquidation();

async function addOrderToUser(
  values: any,
  derivedOrderId: string,
  margin: number,
) {
  const {
    email,
    marketId,
    positionType,
    inputQty,
    inputLeverage,
    marketType,
    inputPrice,
  } = values;
  console.log("adding the order to users Orders...");
  for (let user of users) {
    if (user.username === email) {
      if (user.collateral.availabe < margin) {
        throw new Error("Insufficient balance");
      }

      user.collateral.availabe -= margin;

      user.collateral.locked += margin;
      user.orders.push({
        orderId: derivedOrderId,
        market: marketId,
        type: positionType,
        qty: inputQty,
        margin: margin,
        leverage: inputLeverage,
        orderType: marketType,
        price: inputPrice,
        filledQty: 0,
        remainingQty: inputQty,
        status: "opened",
      });

      console.log("Order is been added with values , \n ", user.orders);
      break;
    }
  }
}

async function matchingEngine(
  list: LinkedList,
  values: any,
  bestPrice: number,
  margin: number,
) {
  console.log("Starting Matching Engine.....");
  const {
    inputQty,
    email,
    marketId,
    derivedOrderId,
    inputLeverage,
    positionType,
  } = values;

  let userRemainingQty: number = inputQty;
  let y: number = 0;

  while (!list.isEmpty() && userRemainingQty > 0) {
    const head = list.getHead();
    console.log("Head is ");
    if (!head) {
      break;
    }
    const restingOrder = head.data;

    const tradedQty = Math.min(userRemainingQty, restingOrder.remainingQty);

    userRemainingQty -= tradedQty;
    restingOrder.remainingQty -= tradedQty;

    console.log("current remaining qty ====> ", userRemainingQty);
    const x = tradedQty * bestPrice;
    y += x;
    console.log("x, y calculation y value is ", y);

    fills.push({
      maker: restingOrder.userId,
      taker: email,
      market: marketId,
      qty: tradedQty,
      price: restingOrder.price,
      long: 1,
      short: 2,
    });

    console.log("pushed to fills array, Looking for Users now...");

    // Updating users Orders and Positions

    for (let user of users) {
      if (user.username === email) {
        console.log("FOund the User , \n", user);
        for (let order of user.orders) {
          console.log("checking orders for orderId: ", derivedOrderId);
          if (order.orderId === derivedOrderId) {
            console.log("Found it, Updating his order...");
            order.remainingQty -= tradedQty;
            order.filledQty += tradedQty;
            order.status = "Partially Filled";
            console.log("here is the updated order.... \n", order);
          }
          break;
        }
        const LiqPriceForOrder = calculateLiquidationPrice(
          y / inputQty,
          inputLeverage,
          positionType,
        );
        console.log(
          "Calculated Liquidity Price ====> ",
          LiqPriceForOrder,
          "\n \n \n now looking for Positions for user...",
        );
        if (user.positions.length === 0) {
          console.log("seems there are no positions, creating one...");
          user.positions.push({
            market: marketId,
            type: positionType,
            qty: inputQty,
            leverage: inputLeverage,
            margin: margin,
            maintainanceMargin: (margin * maintainanceMarginPercent) / 100,
            liquidationPrice: LiqPriceForOrder,
            unrealisedPnL: 0,
            pnL: 0,
            averagePrice: y / inputQty,
          });
          console.log("created new position: \n", user.positions);
        } else {
          let positionForMarketIdExists = false;
          for (let position of user.positions) {
            if (position.market === marketId) {
              positionForMarketIdExists = true;
              if (position.type === positionType) {
                console.log(
                  "<===============  Found a position to update, this is the old Position : ==================> \n ",
                  position,
                );
                const oldQty = position.qty;
                position.qty += tradedQty;
                const newQty = oldQty + tradedQty;

                position.averagePrice =
                  (position.averagePrice * oldQty +
                    restingOrder.price * tradedQty) /
                  newQty;

                position.qty = newQty;

                position.margin += margin * (tradedQty / inputQty); // somthing is not correct here, it fees a bit off

                position.maintainanceMargin =
                  (position.margin * maintainanceMarginPercent) / 100;

                position.liquidationPrice = calculateLiquidationPrice(
                  position.averagePrice,
                  position.leverage,
                  position.type,
                );

                user.collateral.availabe -= margin;
                user.collateral.locked += margin;

                console.log(
                  "<===============  seems the positions were on same side , so these are new values for this position ==============> \n",
                  position,
                );
              } else if (position.type !== positionType) {
                if (position.qty > tradedQty) {
                  position.qty -= tradedQty;
                  const proportion = tradedQty / position.qty;

                  const marginToRelease = position.margin * proportion;

                  position.qty -= tradedQty;

                  position.margin -= marginToRelease;

                  position.maintainanceMargin =
                    (position.margin * maintainanceMarginPercent) / 100;

                  const realisedPnL =
                    position.type === "SHORT"
                      ? (position.averagePrice - restingOrder.price) * tradedQty
                      : (restingOrder.price - position.averagePrice) *
                        tradedQty;

                  position.pnL += realisedPnL;
                  position.liquidationPrice = calculateLiquidationPrice(
                    position.averagePrice,
                    position.leverage,
                    position.type,
                  );

                  user.collateral.locked -= marginToRelease;

                  user.collateral.availabe += marginToRelease + realisedPnL;
                  console.log(
                    "<===============  seems the positions were on Opposite side and initialQTY > incommingQTY , so these are new values for this position ==============> \n",
                    position,
                  );
                  console.log("Updated User Balance is : \n", user.collateral);
                }
                if (position.qty < tradedQty) {
                  const qtyToAdd = tradedQty - position.qty;
                  position.type = positionType;

                  position.qty = qtyToAdd;

                  position.margin = margin * (qtyToAdd / inputQty);

                  position.averagePrice = restingOrder.price;

                  position.leverage = inputLeverage;

                  position.maintainanceMargin =
                    (position.margin * maintainanceMarginPercent) / 100;

                  position.liquidationPrice = calculateLiquidationPrice(
                    position.averagePrice,
                    position.leverage,
                    position.type,
                  );
                  // other values update
                  const finalPnL = position.margin + position.pnL;
                  user.collateral.locked -= margin;
                  user.collateral.availabe += finalPnL;
                  console.log(
                    "<===============  seems the positions were on Opposite side and initialQTY < incommingQTY , so these are new values for this position ==============> \n",
                    position,
                  );
                  console.log("Updated User Balance is : \n", user.collateral);
                }
                if (position.qty === tradedQty) {
                }
              }
            }
          }
          if (!positionForMarketIdExists) {
            user.positions.push({
              market: marketId,
              type: positionType,
              qty: inputQty,
              leverage: inputLeverage,
              margin: margin,
              maintainanceMargin: 0,
              liquidationPrice: 0,
              unrealisedPnL: 0,
              pnL: 0,
              averagePrice: y / inputQty,
            });
            console.log(
              "seems this marketId has no position, added new position : \n",
              user.positions.filter(marketId),
            );
          }
        }
      }

      break;
    }

    if (restingOrder.remainingQty === 0) {
      list.dequeue();
      console.log(
        "there are no orders in this price range, dequeued the Orders List",
      );
    }
  }
  if (list.isEmpty()) {
    console.log("list is empty, updating sortedAskPrice bestprice");
    orderbooks[marketId]?.asks.delete(bestPrice);
    if (!orderbooks[marketId]) {
      return;
    }
    orderbooks[marketId].sortedAskPrices = orderbooks[
      marketId
    ].sortedAskPrices.filter((x) => x !== bestPrice);
  }
}

app.post("/signup", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  let userId = Math.random().toString();

  try {
    const userExists = await db.user.findUnique({
      where: { email: email },
    });

    if (userExists) {
      res.json({ message: "user already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const saveUser = await db.user.create({
      data: { email: email, password: hashedPassword },
    });

    users.push({
      userId: saveUser.userId,
      username: email,
      password: password,
      collateral: {
        availabe: 0,
        locked: 0,
      },
      positions: [],
      orders: [],
    });

    const UserObject: User = {
      userId: userId,
      username: email,
      password: hashedPassword,
      collateral: {
        availabe: 0,
        locked: 0,
      },
      positions: [],
      orders: [],
    };

    const token = jwt.sign({ email: email }, JWT_SECRET, {
      expiresIn: "7d",
    });
    if (!token) {
      console.log("token not generated");
    }

    users.push(UserObject);

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
      console.log("token for signedIn user = ", token);
      return res.status(200).json({ message: "user signed In", token: token });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err });
  }
});

app.post("/onramp", authMiddleware, (req: Request, res: Response) => {
  console.log("calling onramp.....");
  const { amount, email } = req.body;
  console.log("ampunt : ", amount, " for ", email);
  for (let user of users) {
    console.log("hitting onramp => here is the user ===> ", user);
    if (user.username === email) {
      user.collateral.availabe += amount;
      console.log("amount added");
      res.status(200).json({ message: "amount adddedddd" });
    }
  }
});

app.post("/create-order", authMiddleware, (req: Request, res: Response) => {
  let {
    email,
    marketId,
    marketType,
    inputPrice,
    inputQty,
    inputLeverage,
    positionType,
    positionStatus,
  } = req.body;

  console.log(
    "STEP 1 \n Recieved a Create Order request with data : ",
    req.body,
  );
  const derivedOrderId = Math.random().toString();
  let margin: number;
  let bestPrice: number;
  const values = {
    orderId: derivedOrderId,
    email: email,
    marketId: marketId,
    marketType: marketType,
    inputPrice: inputPrice,
    inputQty: inputQty,
    inputLeverage: inputLeverage,
    positionType: positionType,
    positionStatus: positionStatus,
  };
  console.log("STEP 2 \n here are the values set : ", values);

  if (positionStatus === "Open") {
    console.log("STEP 3 : seems the position is 'Open'");
    const book = orderbooks[marketId];
    console.log("STEP 4: current Orderbook ======> ", book);
    if (!book) {
      console.log("no orderbook exists for order ", marketId);
      return;
    }
    if (positionType === "LONG") {
      console.log("Seems position is LONG");
      if (marketType === "Market") {
        console.log("Seems the position is Market as well");
        for (let order in book?.sortedAskPrices) {
          bestPrice = Number(order);
          console.log("well best price for now is =====> ", bestPrice);
          margin = (bestPrice * inputQty) / inputLeverage;
          console.log("here is the margin that is been calculated : ", margin);
          addOrderToUser(req.body, derivedOrderId, margin);
          const list = orderbooks[marketId]?.asks.get(bestPrice);
          console.log("here is the list ====> ", list);
          if (!list) {
            console.log("no list exists for this price");
            continue;
          }
          matchingEngine(list, values, bestPrice, margin);
        }
      } else {
        console.log("Seems the position is LIMIT as well");
        let orderMatchingPriceFound = false;
        for (let order of book?.sortedAskPrices) {
          console.log("picking for order , ", order);
          if (inputPrice >= order) {
            orderMatchingPriceFound = true;
            bestPrice = Number(order);
            margin = (bestPrice * inputQty) / inputLeverage;
            addOrderToUser(req.body, derivedOrderId, margin);
            const list = orderbooks[marketId]?.asks.get(bestPrice);
            if (!list) {
              console.log("no list exists for this price");
              continue;
            }
            matchingEngine(list, values, bestPrice, margin);
            break;
          }
        }
        if (!orderMatchingPriceFound) {
          const singleOrder = {
            orderId: derivedOrderId,
            price: inputPrice,
            qty: inputQty,
            remainingQty: inputQty,
            userId: email,
            market_id: marketId,
            status: positionStatus,
            side: positionType,
          };
          book.sortedBidPrices.push(inputPrice);
          book.sortedBidPrices.sort((a, b) => b - a); // check once if the sorting is correct
          const list = new LinkedList();
          list.append(singleOrder);
          book.bids.set(inputPrice, list);
        }
      }
    } else if (positionType === "SHORT") {
      console.log("Seems position is SHORT");
      if (marketType === "Market") {
        console.log("Seems position is Market as well");
        for (let order of book?.sortedBidPrices) {
          bestPrice = order;

          margin = (bestPrice * inputQty) / inputLeverage;
          addOrderToUser(req.body, derivedOrderId, margin);
          const list = orderbooks[marketId]?.bids.get(bestPrice);
          if (!list) {
            console.log("no list exists for this price");
            continue;
          }
          matchingEngine(list, values, bestPrice, margin);
        }
      } else {
        for (let order of book?.sortedBidPrices) {
          if (inputPrice >= order) {
            bestPrice = order;
            margin = (bestPrice * inputQty) / inputLeverage;
            addOrderToUser(req.body, derivedOrderId, margin);
            const list = orderbooks[marketId]?.bids.get(bestPrice);
            if (!list) {
              console.log("no list exists for this price");
              continue;
            }
            matchingEngine(list, values, bestPrice, margin);
            break;
          }
        }
      }
    }
  }
});
app.post("/close-order", authMiddleware, (req: Request, res: Response) => {});
app.delete("/order", authMiddleware, (req: Request, res: Response) => {});
app.get(
  "/equity/available",
  authMiddleware,
  (req: Request, res: Response) => {},
);
app.get(
  "/positions/open/:marketId",
  authMiddleware,
  (req: Request, res: Response) => {},
);
app.get(
  "/positions/closed/:marketId",
  authMiddleware,
  (req: Request, res: Response) => {},
);
app.get(
  "/orders/open/:marketId",
  authMiddleware,
  (req: Request, res: Response) => {},
);
app.get(
  "/orders/:marketId",
  authMiddleware,
  (req: Request, res: Response) => {},
);
app.get("/fills", authMiddleware, (req: Request, res: Response) => {});

//==========================================   FUNCTIONS    =============================================

app.listen(3000, () => {
  console.log("server starteddddd at 3000!");
});
