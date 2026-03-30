import {
  isAllowed,
  setAllowed,
  getAddress,
  signTransaction,
} from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID!;
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org:443";

export const server = new StellarSdk.rpc.Server(RPC_URL);

export async function checkConnection() {
  const result = await isAllowed();
  return result.isAllowed;
}

export async function connectWallet() {
  const allowed = await isAllowed();
  if (allowed.isAllowed) {
    const { address } = await getAddress();
    return address;
  } else {
    const setAllowedRes = await setAllowed();
    if (setAllowedRes.isAllowed) {
      const { address } = await getAddress();
      return address;
    }
  }
  return null;
}

const contract = new StellarSdk.Contract(CONTRACT_ID);

export async function getFloodStatus(): Promise<boolean> {
  try {
    const result = await server.simulateTransaction(
      new StellarSdk.TransactionBuilder(
        new StellarSdk.Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
        { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
      )
      .addOperation(contract.call("get_flood_status"))
      .build()
    );

    if (StellarSdk.rpc.Api.isSimulationSuccess(result)) {
      return StellarSdk.scValToNative(result.result!.retval) as boolean;
    }
    return false;
  } catch (e) {
    console.error("Error fetching flood status:", e);
    return false;
  }
}

export async function isUserRegistered(userAddress: string): Promise<boolean> {
  try {
    const address = new StellarSdk.Address(userAddress);
    const result = await server.simulateTransaction(
      new StellarSdk.TransactionBuilder(
        new StellarSdk.Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
        { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
      )
      .addOperation(contract.call("is_registered", address.toScVal()))
      .build()
    );

    if (StellarSdk.rpc.Api.isSimulationSuccess(result)) {
      return StellarSdk.scValToNative(result.result!.retval) as boolean;
    }
    return false;
  } catch (e) {
    console.error("Error checking registration:", e);
    return false;
  }
}

export async function hasUserClaimed(userAddress: string): Promise<boolean> {
  try {
    const address = new StellarSdk.Address(userAddress);
    const result = await server.simulateTransaction(
      new StellarSdk.TransactionBuilder(
        new StellarSdk.Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0"),
        { fee: "100", networkPassphrase: NETWORK_PASSPHRASE }
      )
      .addOperation(contract.call("has_claimed", address.toScVal()))
      .build()
    );

    if (StellarSdk.rpc.Api.isSimulationSuccess(result)) {
      return StellarSdk.scValToNative(result.result!.retval) as boolean;
    }
    return false;
  } catch (e) {
    console.error("Error checking claim status:", e);
    return false;
  }
}

export async function claimRelief(userAddress: string) {
  try {
    const address = new StellarSdk.Address(userAddress);
    const account = await server.getAccount(userAddress);
    
    const tx = new StellarSdk.TransactionBuilder(account, {
      fee: "10000",
      networkPassphrase: NETWORK_PASSPHRASE,
    })
    .addOperation(contract.call("claim_relief", address.toScVal()))
    .setTimeout(30)
    .build();

    const simulation = await server.simulateTransaction(tx);
    if (!StellarSdk.rpc.Api.isSimulationSuccess(simulation)) {
        throw new Error("Simulation failed");
    }

    const assembledTx = StellarSdk.rpc.assembleTransaction(tx, simulation);
    const { signedTxXdr } = await signTransaction(assembledTx.build().toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    const sentTx = await server.sendTransaction(
      StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE) as StellarSdk.Transaction
    );

    if (sentTx.status === "PENDING") {
        let status = "PENDING";
        while (status === "PENDING") {
            const txStatus = await server.getTransaction(sentTx.hash);
            status = txStatus.status;
            if (status === "SUCCESS") return txStatus;
            if (status === "FAILED") throw new Error("Transaction failed");
            await new Promise((r) => setTimeout(r, 1000));
        }
    }
    return sentTx;
  } catch (e) {
    console.error("Error claiming relief:", e);
    throw e;
  }
}
