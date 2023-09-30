import * as algokit from '@algorandfoundation/algokit-utils'
import { CalculatorAppClient } from '../artifacts/CalculatorApp/client'

// Below is a showcase of various deployment options you can use in TypeScript Client
export async function deploy() {
  console.log('=== Deploying HelloWorld ===')

  const algod = algokit.getAlgoClient()
  const indexer = algokit.getAlgoIndexerClient()
  const deployer = await algokit.mnemonicAccountFromEnvironment({ name: 'DEPLOYER', fundWith: algokit.algos(3) }, algod)
  await algokit.ensureFunded(
    {
      accountToFund: deployer,
      minSpendingBalance: algokit.algos(2),
      minFundingIncrement: algokit.algos(2),
    },
    algod,
  )
  const appClient = new CalculatorAppClient(
    {
      resolveBy: 'creatorAndName',
      findExistingUsing: indexer,
      sender: deployer,
      creatorAddress: deployer.addr,
    },
    algod,
  )
  const app = await appClient.deploy({
    onSchemaBreak: 'append',
    onUpdate: 'append',
  })

  // If app was just created fund the app account
  if (['create', 'replace'].includes(app.operationPerformed)) {
    algokit.transferAlgos(
      {
        amount: algokit.algos(1),
        from: deployer,
        to: app.appAddress,
      },
      algod,
    )
  }

  const method = 'hello'
  const response = await appClient.hello({ name: 'world' })
  console.log(`Called ${method} on ${app.name} (${app.appId}) with name = world, received: ${response.return}`)

  const method1 = 'add'
  const response1 = await appClient.hello({ num: 7 })
  console.log(`Called ${method1} on ${app.name} (${app.appId}) with name = world, received: ${response1.return}`)

  const method2 = 'subtract'
  const response2 = await appClient.hello({ num: 5 })
  console.log(`Called ${method2} on ${app.name} (${app.appId}) with name = world, received: ${response2.return}`)

  const method3 = 'multiple'
  const response3 = await appClient.hello({ num: 3 })
  console.log(`Called ${method3} on ${app.name} (${app.appId}) with name = world, received: ${response3.return}`)

  const method4 = 'divide'
  const response4 = await appClient.hello({ num: 2 })
  console.log(`Called ${method4} on ${app.name} (${app.appId}) with name = world, received: ${response4.return}`)
}
