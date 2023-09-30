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
  const [adress, setAdress] = useState<string>('')

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
      response = await appClient.pay({ num: highestBid, adress: adress }).catch((e: Error) => {
        enqueueSnackbar(`Error calling the contract: ${e.message}`, { variant: 'error' })
        setLoading(false)
        return
      })
    }
    // else {
    //   response = await appClient.subtract({ num: contractInput }).catch((e: Error) => {
    //     enqueueSnackbar(`Error calling the contract: ${e.message}`, { variant: 'error' })
    //     setLoading(false)
    //     return
    //   })
    // }
    enqueueSnackbar(`Response from the contract: ${response?.return}`, { variant: 'success' })
    setLoading(false)
  }

  return (
    <dialog id="appcalls_modal" className={`modal ${openModal ? 'modal-open w-10' : ''} bg-slate-200`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-lg">Say hello to your Algorand smart contract</h3>
        <br />
        <h3 className="font-bold text-lg">Total: {}</h3>
        <br />
        <input
          type="number"
          placeholder="Provide input"
          className="input input-bordered w-full"
          // value={contractInput}
          onChange={(e) => {
            setHighestBid(Number(e.target.value))
          }}
        />
        <input
          type="text"
          placeholder="Provide input"
          className="input input-bordered w-full"
          // value={contractInput}
          onChange={(e) => {
            setAdress(e.target.value)
          }}
        />
        <div className="modal-action ">
          <button className="btn" onClick={() => setModalState(!openModal)}>
            Close
          </button>
          <button className={`btn`} onClick={() => sendAppCall('pay')}>
            {loading ? <span className="loading loading-spinner" /> : 'pay'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default Auction
