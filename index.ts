import type { Request, Response } from "express";
import express from "express";
import { db } from "./utils/prisma";
import jwt from "jsonwebtoken";
import z from "zod";
import bcrypt, { hash } from "bcrypt";
import { authMiddleware } from "./middleware/auth";
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
  {
    userId: "1",
    username: "harkirat",
    password: "123123",
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
        orderId: "10",
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
        orderId: "11",
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
        orderId: "12",
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
    userId: "2",
    username: "raman",
    password: "123123",
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
        orderId: "10",
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
        orderId: "11",
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
        orderId: "12",
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
      if (
        current.next.data.orderId === orderId
      ) {
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

  getOrder(orderId:string){
    if(!this.head) {throw new Error("no head")}
    let current = this.head
    while(current.next !== null){
      if(current.data.orderId === orderId){
        return current.data
      }
      current = current.next
    }
    console.log("Order with ", orderId, " did not found")
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
  lastTradedPrice: number, 
  indexPrice: number
}

export interface OrderBooks {
  [market: string]: SingleOrderBook;
}
const orderbooks: OrderBooks = {
    SOL: {
    asks: new Map<number, LinkedList>(),
    bids: new Map<number, LinkedList>(),
    sortedAskPrices: [],
    sortedBidPrices: [],
    orderMap: new Map<string, Node>(),
    lastTradedPrice: 90, 
    indexPrice: 90.01 
  },

  BTC: {
    asks: new Map<number, LinkedList>(),
    bids: new Map<number, LinkedList>(),
    sortedAskPrices: [],
    sortedBidPrices: [],
    orderMap: new Map<string, Node>(),
    lastTradedPrice: 90, 
    indexPrice: 90.01 
  },
};

interface Fills {
    maker: string,
    taker: string,
    market: string,
    qty: number,
    price: number,
    long: number,
    short: number,
}

const fills:Fills[] = [
  {
    maker: "1",
    taker: "2",
    market: "SOL",
    qty: 10,
    price: 90,
    long: 1,
    short: 2,
  },
  {
    maker: "1",
    taker: "2",
    market: "ETH",
    qty: 1,
    price: 1900,
    long: 2,
    short: 1,
  },
];

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
      console.log("token for signedIn user = " , token)
      return res.status(200).json({ message: "user signed In", token: token });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err });
  }
});

app.post("/onramp", authMiddleware, (req:Request, res:Response) => {
    const {marketId, amount, email} = req.body
    for (let user of users){
        if( user.username === email) {
            user.collateral.availabe +=amount
        }
    }
});

app.post("/create-order",authMiddleware, (req:Request, res:Response) => {
    let { email, marketId, marketType, price, qty, leverage, position, positionStatus } = req.body
    // example body : {marketId: "SOL", marketType: "Market/Limit", price: 90, qty: 10, leverage: 5, position: Long/Short, positionStatus: Open/Close}
    const derivedOrderId = Math.random().toString()
    if(positionStatus === "Open") {

        if(marketType === "Market") {
            // inputs => qty, leverage. price will be best available.
            let bestAskPrice = orderbooks[marketId]?.sortedAskPrices[0]
            if(!bestAskPrice){
                console.log("no last price exists"); 
                return
            }
            let userRemainingQty = qty
            const margin = (bestAskPrice * qty) / leverage
            for(let user of users){
                if(user.username === email) {
                    if(user.collateral.availabe >= margin) {
                        user.collateral.availabe -= margin
                        user.collateral.locked += margin
                    }
                    user.orders.push({
                        orderId: derivedOrderId,
                        market: marketId,
                        type: position,
                        qty: qty,
                        margin: margin,
                        leverage: leverage,
                        orderType: marketType,
                        price: price,
                        filledQty: 0,
                        remainingQty: qty,
                        status: "opened",
                    })
                    
                    break;
                }
            }
            if(position === "Long") {
                const sortedAsks = orderbooks[marketId]?.sortedAskPrices
                if(sortedAsks) {
                    for(let ask of sortedAsks) {
                        
                        const list = orderbooks[marketId]?.asks.get(ask)
                        if(!list){
                            continue
                        }
                        while(!list.isEmpty() && userRemainingQty > 0) {
                            const head = list.getHead();
                            if (!head) {
                              break;
                            }
                            const restingOrder = head.data;

                            const tradedQty = Math.min(
                                userRemainingQty,
                                restingOrder.remainingQty,
                            );

                            userRemainingQty -= tradedQty;
                            restingOrder.remainingQty -= tradedQty;
                            let y = 0
                            for(let user of users){
                                if(user.username === email) {
                                    for(let order of user.orders){
                                        if(order.orderId === derivedOrderId) {
                                            order.remainingQty -= tradedQty;
                                            order.filledQty += tradedQty
                                            const x = tradedQty * ask
                                            y += x
                                            if(order.remainingQty === 0){
                                                order.status = "Filled"

                                                if(user.positions.length === 0) {
                                                    user.positions.push({
                                                        market: marketId,
                                                        type: "LONG",
                                                        qty: qty,
                                                        leverage: leverage,
                                                        margin: margin,
                                                        maintainanceMargin: 0,
                                                        liquidationPrice: 0,
                                                        unrealisedPnL: 0,
                                                        pnL: 0,
                                                        averagePrice: y/qty,
                                                    })
                                                } else {
                                                    for(let position of user.positions){
                                                        if(position.market === marketId){
                                                            if(position.type === "LONG"){
                                                                position.qty += qty
                                                            } else if (position.type === "SHORT"){
                                                                if(position.qty > qty){position.qty -= qty}
                                                                if(position.qty < qty){
                                                                    const qtyToAdd = qty - position.qty
                                                                    position.type = "LONG"
                                                                    position.qty = qtyToAdd
                                                                    // other values update

                                                                    const finalPnL = position.margin + position.pnL
                                                                    user.collateral.locked -= margin
                                                                    user.collateral.availabe += finalPnL
                                                                }
                                                                if(position.qty === qty){}
                                                            }
                                                            
                                                        }
                                                    }
                                                }

                                                
                                                
                                                
                                            }
                                            else {
                                                order.status = "Pratially Filled"
                                            }
                                            
                                            break
                                        }
                                    }
                                    
                                    break;
                                }
                            }

                            if( userRemainingQty = 0){
                                fills.push({
                                    maker: restingOrder.userId,
                                    taker: email,
                                    market: marketId,
                                    qty: tradedQty,
                                    price: restingOrder.price,
                                    long: 1,
                                    short: 2,
                                })
                                break;
                            }

                            if(restingOrder.remainingQty === 0) {
                                list.dequeue()

                            }
                        
                        }
                        if(list.isEmpty()){
                            list.deleteOrder(derivedOrderId)
                        }                  
                    }
                }
                
            } else {

            }

        } else {
            // inputs => price, qty, leverage. price will be best available.
            const margin = (price * qty) / leverage
            if(position === "Long") {

            } else {

            }

        }


    } else {
        if(marketType === "Market") {
            // inputs => qty, leverage. price will be best available.

            if(position === "Long") {

            } else {

            }

        } else {
            // inputs => price, qty, leverage. price will be best available.
            if(position === "Long") {

            } else {

            }

        }
    }

});
app.post("/close-order",authMiddleware, (req:Request, res:Response) => {});
app.delete("/order",authMiddleware, (req:Request, res:Response) => {});
app.get("/equity/available",authMiddleware, (req:Request, res:Response) => {});
app.get("/positions/open/:marketId",authMiddleware, (req:Request, res:Response) => {});
app.get("/positions/closed/:marketId",authMiddleware, (req:Request, res:Response) => {});
app.get("/orders/open/:marketId",authMiddleware, (req:Request, res:Response) => {});
app.get("/orders/:marketId",authMiddleware, (req:Request, res:Response) => {});
app.get("/fills",authMiddleware, (req:Request, res:Response) => {});



//==========================================   FUNCTIONS    =============================================

async function liqudationChecks(asset: string, price: number) {}

async function validateMargin(margin:number){}

async function lockCollateral(user:string, amount:number){}

async function unLockCollateral(user:string, amount:number){}

async function onPriceUpdateFromBinance(asset: string, price: number) {
  liqudationChecks(asset, price);
}


app.listen(3000, () => {
  console.log("server starteddddd at 3000!");
});
