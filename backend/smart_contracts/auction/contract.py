import beaker
import pyteal as pt


class AuctionState:
    highest_bid = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64, descr="Highest bid", default=pt.Int(0)
    )
    highest_bidder = beaker.GlobalStateValue(
        stack_type=pt.TealType.bytes, descr="Highest bidder", default=pt.Bytes("")
    )
    auction_end = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64,descr="Timestamp of the auction's end", default=pt.Int(0)
    )


app = beaker.Application("AuctionApp", state=AuctionState)


@app.external
def pay(num: pt.abi.Uint64, name: pt.abi.String, *, output: pt.abi.String) -> pt.Expr:
    """place your bid"""
    return pt.Seq(
        pt.Assert(app.state.auction_end.get() > pt.Global.latest_timestamp()),
        pt.Assert(app.state.auction_end.get() != pt.Int(0)),
        pt.Assert(num.get() > app.state.highest_bid.get()), 
        app.state.highest_bidder.set(name.get()),
        app.state.highest_bid.set(num.get()),
        output.set(
            pt.Concat(
                pt.Bytes("Highest bidder is: "),
                app.state.highest_bidder.get(),
                pt.Bytes(" with bid: "),
                pt.Itob(app.state.highest_bid.get()),
            )
        ),
    )
    
@app.external
def start_auction(starting_price: pt.abi.Uint64, length: pt.abi.Uint64)-> pt.Expr: 
    """start a new auction"""
    return pt.Seq(
        pt.If(app.state.auction_end.get() < pt.Global.latest_timestamp()).Then(
            app.state.auction_end.set(pt.Int(0))
        ),
        pt.Assert(app.state.auction_end.get() == pt.Int(0)),
        app.state.highest_bid.set(starting_price.get()),
        app.state.auction_end.set(length.get() + pt.Global.latest_timestamp()),
    )
    
@app.external
def force_stop_auction(*,output: pt.abi.String)-> pt.Expr:
    """force stop the current auction"""
    return pt.Seq(
        pt.If(app.state.auction_end.get() != pt.Int(0)).Then(
                output.set(pt.Bytes("Auction has been stopped!")),
        ).Else(output.set(pt.Bytes("Auction never got started!"))),
        app.state.auction_end.set(pt.Int(0)),
    )
