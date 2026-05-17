# => want to Long / Short an Asset ? 
# => place a limit / market order 
[ here we are manually defining Qty , Price and leverage at the same point and Margin , Collateral , NotionValue, Maintainance Margin , Mark price , etc is been calculated ]
# => if Market order, 
it gets filled with best price for the qty and THEN your longing / shorting starts 
# => if it is Limit Order and you longed and your order isnt matched 
you will sit on order book and if someone wants to Short with same price your order will fill / partially filles and only the your longing will start 
# => now after longing / shorting is placed 
now PnL engine takes live prices from Binance or anyhere and calculates unRealised PnL and uses some formula there 
    (CurrentPrice - EntryPrice) x Qty = PnL
# => now you can manually close the longing and sit again on order book at final price you decide and get matched with someone who is shorting and get filled 
# => if not you will go on until your loss > collateral 
there it will autoLiquidate after a maintainance margin like 5% 
# => Now again matching engine will start matching and order will be filled then


## Things i Need to make
- Matching Logic
- Position Logic => track live PnL with live Position of Long / Short.
- Lock Collateral Logic
- Risk Logic checking Liquidation
- calculate Mark Price with index price
- Liquidation Engine to Force close bad positions
- Funding Rate Engine - Keep perp price near spot

## Updated Flow:
1. User input => Margin, Qty, Leverage, Long/Short, Open/Close, Market/limit
2. Validate Margin => check if Available balance > Margin => Collateral = Margin user inputed
3. Validate order => check if existing position: if no create new else update existing one + basic checks like qty > 0 [use Zod Validation here]
4. Calculate notional => Margin x Leverage
5. Calculate required margin => if price x Qty < Margin it will be a valid Notional
6. Lock collateral => Available Balance - Valid Margin
7. Create pending order => status as Pending => add in Users Orders and Positions Array
8. Matching engine => travers through Bids/Asks Array and check for Best price for Market
9. Partial/full fill handling
10. Add fills => add each fill in fills array
11. Create/update position
12. Calculate average entry => if position is updated
13. Calculate liquidation price => [a live price of SOL where that Order has to autoLiquidate, can bare more loss than this because Collateral isnt enough]
long: EntryPrice x (1 - (1/leverage) + maintainanceMargin %)
short: EntryPrice x (1 + (1/leverage) - maintainanceMargin %)
Maintainance Margin = 5% means = 5% of initial Margin
14. Update unrealized pnl => (CurrentPrice - EntryPrice) x qty
15. Risk engine check => check if Margin + PnL > MaintainanceMargin. else autoLiquidation
16. Maintenance margin check 
17. Auto liquidation if needed => loop through orders with every price update in Binance API
18. Liquidation order enters orderbook 
19. Matching engine executes liquidation
20. Final state

21. Case of Slipage => 1 Order wont fill your Position Opening => partial fills different different prices
    before => 90 → 10   new Order => 25 qty at MarketPrice          90 → removed
              91 → 8                                                91 → removed
              92 → 20                                               92 → 13 remaining
    3 different fills in Fills[]
    But in Position[] entryPrice = weightedAvg = [(10×90)+(8×91)+(7×92)​] / 25 = 90.88 as EntryPrice for this position
    Because of Slipage User might get -ve PnL in start, becs bought at higher prices as well

## Important Points Cleared
- Longing Position => goes to BIDS
- shorting Position => goes to ASKS
- Closing Long => goes to Asks [becomes Sell basically] 
- Closing Short => goes to Bids [becomes Buy basically]
- User cannot do 10 different Long orders
    it new long gets added to users existing Long
    calculating the average price => as index price 
- If User has Longed and creates new Short
    it will reduce the qty from Long
    eg: old => Long 10 @100
        new => Short 5 @110
        Final => keep only: Long 5 @100


Questions:
What is lastTradedProce
What is indexPrice and, actualy price to map an Order. difference betn both