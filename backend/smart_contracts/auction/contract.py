import beaker
import pyteal as pt


class AuctionState:
    highest_bid = beaker.GlobalStateValue(
        stack_type=pt.TealType.uint64, descr="Highest bid", default=pt.Int(0)
    )
    highest_bidder = beaker.GlobalStateValue(
        stack_type=pt.TealType.bytes, descr="Highest bidder"
    )


app = beaker.Application("AuctionApp", state=AuctionState)


@app.external
def pay(num: pt.abi.Uint64, adress: pt.abi.String, *, output: pt.abi.String) -> pt.Expr:
    """place your bid"""
    return pt.Seq(
        pt.Assert(app.state.highest_bid.get() < num.get()),
        app.state.highest_bidder.set(adress.get()),
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
