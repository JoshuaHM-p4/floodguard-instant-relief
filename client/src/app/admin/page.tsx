"use client";

import { useState } from "react";
import { Shield, Users, AlertTriangle, Loader2, CheckCircle, Droplets, Wallet } from "lucide-react";
import { connectWallet, server } from "@/lib/stellar";
import * as StellarSdk from "@stellar/stellar-sdk";

const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID!;
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

export default function AdminPage() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [residentAddress, setResidentAddress] = useState("");

  const handleConnect = async () => {
    const pubKey = await connectWallet();
    if (pubKey) setAddress(pubKey);
  };

  const invokeContract = async (method: string, args: any[] = []) => {
    if (!address) return;
    setLoading(true);
    setStatusMessage(`Invoking ${method}...`);
    try {
      const contract = new StellarSdk.Contract(CONTRACT_ID);
      const account = await server.getAccount(address);
      
      const tx = new StellarSdk.TransactionBuilder(account, {
        fee: "10000",
        networkPassphrase: NETWORK_PASSPHRASE,
      })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

      const simulation = await server.simulateTransaction(tx);
      if (!StellarSdk.SorobanRpc.Api.isSimulationSuccess(simulation)) {
          throw new Error("Simulation failed: " + JSON.stringify(simulation.result));
      }

      const assembledTx = StellarSdk.assembleTransaction(tx, simulation);
      const { signTransaction } = await import("@stellar/freighter-api");
      const signedTxXdr = await signTransaction(assembledTx.toXDR(), {
        networkPassphrase: NETWORK_PASSPHRASE,
      });

      const sentTx = await server.sendTransaction(
        StellarSdk.TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE) as StellarSdk.Transaction
      );

      setStatusMessage(`Transaction submitted: ${sentTx.hash.slice(0, 8)}... Waiting for confirmation.`);

      if (sentTx.status === "PENDING") {
          let status = "PENDING";
          while (status === "PENDING") {
              const txStatus = await server.getTransaction(sentTx.hash);
              status = txStatus.status;
              if (status === "SUCCESS") {
                setStatusMessage(`Success! ${method} completed.`);
                return;
              }
              if (status === "FAILED") throw new Error("Transaction failed");
              await new Promise((r) => setTimeout(r, 1000));
          }
      }
    } catch (error: any) {
      console.error(error);
      setStatusMessage(`Error: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const setFloodStatus = (isCritical: boolean) => {
    invokeContract("set_flood_status", [StellarSdk.nativeToScVal(isCritical)]);
  };

  const registerResident = () => {
    if (!residentAddress) return;
    try {
      const addr = new StellarSdk.Address(residentAddress);
      invokeContract("register_user", [addr.toScVal()]);
    } catch (e) {
      setStatusMessage("Invalid Stellar address");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-slate-900 dark:text-white">FloodGuard Admin</span>
          </div>
          <button onClick={handleConnect} className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
            <Wallet className="h-4 w-4" />
            {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "Connect Admin Wallet"}
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 rounded-xl bg-blue-600 p-6 text-white shadow-lg">
          <h1 className="mb-2 text-2xl font-bold">NGO Control Panel</h1>
          <p className="opacity-90 text-sm">Use this dashboard to manage flood status and pre-register residents for emergency relief.</p>
        </div>

        <div className="grid gap-6">
          {/* Flood Status Control */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold">Flood Status Control</h2>
            </div>
            <p className="mb-6 text-sm text-slate-500 italic">This simulates IoT sensor data being pushed to the contract.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setFloodStatus(true)}
                disabled={loading || !address}
                className="flex-1 rounded-lg bg-red-600 py-3 font-bold text-white transition-all hover:bg-red-700 disabled:opacity-50"
              >
                Trigger CRITICAL
              </button>
              <button 
                onClick={() => setFloodStatus(false)}
                disabled={loading || !address}
                className="flex-1 rounded-lg bg-emerald-600 py-3 font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
              >
                Reset to NORMAL
              </button>
            </div>
          </section>

          {/* Resident Registration */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-bold">Register Resident</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Stellar Wallet Address</label>
                <input 
                  type="text" 
                  value={residentAddress}
                  onChange={(e) => setResidentAddress(e.target.value)}
                  placeholder="G..." 
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800"
                />
              </div>
              <button 
                onClick={registerResident}
                disabled={loading || !address || !residentAddress}
                className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50"
              >
                Register Resident
              </button>
            </div>
          </section>

          {statusMessage && (
            <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/20">
              {loading ? <Loader2 className="mt-1 h-4 w-4 animate-spin text-blue-600" /> : <Info className="mt-1 h-4 w-4 text-blue-600" />}
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{statusMessage}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
