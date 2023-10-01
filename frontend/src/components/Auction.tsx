import * as algokit from '@algorandfoundation/algokit-utils'
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'
import { AppDetails } from '@algorandfoundation/algokit-utils/types/app-client'
import { useWallet } from '@txnlab/use-wallet'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { AuctionAppClient } from '../contracts/AuctionApp'
import { getAlgodConfigFromViteEnvironment, getIndexerConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface AppCallsInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const Auction = ({ openModal, setModalState }: AppCallsInterface) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [highestBid, setHighestBid] = useState<number>(0)
  const [highestBidder, setHighestBidder] = useState<string>('')
  const [BidText, setBidText] = useState<string>('')
  const [BidderText, setBidderText] = useState<string>('')
  const [length, setLength] = useState<number>(0)

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algodClient = algokit.getAlgoClient({
    server: algodConfig.server,
    port: algodConfig.port,
    token: algodConfig.token,
  })

  const indexerConfig = getIndexerConfigFromViteEnvironment()
  const indexer = algokit.getAlgoIndexerClient({
    server: indexerConfig.server,
    port: indexerConfig.port,
    token: indexerConfig.token,
  })

  const { enqueueSnackbar } = useSnackbar()
  const { signer, activeAddress } = useWallet()

  const sendAppCall = async (operation: string) => {
    setLoading(true)

    const appDetails = {
      resolveBy: 'creatorAndName',
      sender: { signer, addr: activeAddress } as TransactionSignerAccount,
      creatorAddress: activeAddress,
      findExistingUsing: indexer,
    } as AppDetails

    const appClient = new AuctionAppClient(appDetails, algodClient)

    // Please note, in typical production scenarios,
    // you wouldn't want to use deploy directly from your frontend.
    // Instead, you would deploy your contract on your backend and reference it by id.
    // Given the simplicity of the starter contract, we are deploying it on the frontend
    // for demonstration purposes.
    const deployParams = {
      onSchemaBreak: 'append',
      onUpdate: 'append',
    }
    await appClient.deploy(deployParams).catch((e: Error) => {
      enqueueSnackbar(`Error deploying the contract: ${e.message}`, { variant: 'error' })
      setLoading(false)
      return
    })

    let response
    if (operation == 'pay') {
      response = await appClient
        .pay({ num: highestBid, name: highestBidder })
        .then(() => {
          setBidText(String(highestBid))
          setBidderText(highestBidder)
          setLoading(false)
        })
        .catch((e: Error) => {
          enqueueSnackbar(`Error calling the contract: ${e.message}`, { variant: 'error' })
          setLoading(false)
          return
        })
    }
    if (operation == 'start_auction') {
      response = await appClient.startAuction({ starting_price: highestBid, length: length }).catch((e: Error) => {
        enqueueSnackbar(`Error calling the contract: ${e.message}`, { variant: 'error' })
        setLoading(false)
        return
      })
    }
    if (operation == 'force_stop_auction') {
      response = await appClient
        .forceStopAuction({})
        .then(() => {
          setBidText('')
          setBidderText('')
        })
        .catch((e: Error) => {
          enqueueSnackbar(`Error calling the contract: ${e.message}`, { variant: 'error' })
          setLoading(false)
          return
        })
    }
    enqueueSnackbar(`Response from the contract: ${response?.return}`, { variant: 'success' })
    setLoading(false)
  }

  return (
    <dialog id="appcalls_modal" className={`modal ${openModal ? 'modal-open' : ''} bg-slate-200`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-lg">Say hello to your Algorand smart contract</h3>
        <br />
        <h3 className="font-bold text-lg">Highest bid: {BidText}</h3>
        <br />
        <h3 className="font-bold text-lg">Highest bidder: {BidderText}</h3>
        <br />
        <input
          type="number"
          placeholder="Your bid"
          className="input input-bordered w-full"
          // value={contractInput}
          onChange={(e) => {
            setHighestBid(Number(e.target.value))
          }}
        />
        <br />
        <br />
        <input
          type="text"
          placeholder="Your name"
          className="input input-bordered w-full"
          // value={contractInput}
          onChange={(e) => {
            setHighestBidder(e.target.value)
          }}
        />
        <br />
        <br />
        <br />
        <br />
        <input
          type="text"
          placeholder="Starting price"
          className="input input-bordered w-full"
          // value={contractInput}
          onChange={(e) => {
            setHighestBid(Number(e.target.value))
          }}
        />
        <br />
        <br />
        <input
          type="text"
          placeholder="Length"
          className="input input-bordered w-full"
          // value={contractInput}
          onChange={(e) => {
            setLength(Number(e.target.value))
          }}
        />
        <div className="modal-action">
          <button className="btn" onClick={() => setModalState(!openModal)}>
            Close
          </button>
          <button className="btn" onClick={() => sendAppCall('pay')}>
            {loading ? <span className="loading loading-spinner" /> : 'pay'}
          </button>
          <button className={`btn`} onClick={() => sendAppCall('start_auction')}>
            {loading ? <span className="loading loading-spinner" /> : 'start auction'}
          </button>
          <button className={`btn`} onClick={() => sendAppCall('force_stop_auction')}>
            {loading ? <span className="loading loading-spinner" /> : 'force stop auction'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default Auction
