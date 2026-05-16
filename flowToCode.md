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

## Final Flow:
1. User input
2. Validate order
3. Validate leverage
4. Calculate notional
5. Calculate required margin
6. Lock collateral
7. Create pending order
8. Matching engine
9. Partial/full fill handling
10. Add fills
11. Create/update position
12. Calculate average entry
13. Calculate liquidation price
14. Update unrealized pnl
15. Risk engine check
16. Maintenance margin check
17. Auto liquidation if needed
18. Liquidation order enters orderbook
19. Matching engine executes liquidation
20. Final state

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
