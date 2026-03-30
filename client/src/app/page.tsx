"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Droplets, Wallet, ShieldAlert, Loader2, Info } from "lucide-react";
import { 
  connectWallet, 
  getFloodStatus, 
  isUserRegistered, 
  hasUserClaimed, 
  claimRelief 
} from "@/lib/stellar";

export default function Home() {
  const [address, setAddress] = useState<string | null>(null);
  const [isCritical, setIsCritical] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  const fetchData = async (userAddress?: string) => {
    setFetching(true);
    try {
      const status = await getFloodStatus();
      setIsCritical(status);

      if (userAddress) {
        const registered = await isUserRegistered(userAddress);
        setIsRegistered(registered);
        const claimed = await hasUserClaimed(userAddress);
        setHasClaimed(claimed);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData(address || undefined);
    const interval = setInterval(() => fetchData(address || undefined), 30000);
    return () => clearInterval(interval);
  }, [address]);

  const handleConnect = async () => {
    const pubKey = await connectWallet();
    if (pubKey) {
      setAddress(pubKey);
    }
  };

  const handleClaim = async () => {
    if (!address) return;
    setLoading(true);
    setStatusMessage("Submitting claim to Stellar Testnet...");
    try {
      await claimRelief(address);
      setHasClaimed(true);
      setStatusMessage("Success! 50 USDC has been sent to your wallet.");
    } catch (error) {
      console.error("Claim failed:", error);
      setStatusMessage("Claim failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Droplets className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">FloodGuard</span>
          </div>
          <button 
            onClick={handleConnect}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 active:scale-95"
          >
            <Wallet className="h-4 w-4" />
            {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "Connect Wallet"}
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 py-12">
        {/* Hero Section */}
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Instant Relief, <span className="text-blue-600">Smart Payouts.</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-slate-600 dark:text-slate-400">
            Smart-contract triggered emergency micro-grants for victims of critical flooding. 
            Zero bureaucracy, instant settlement.
          </p>
        </header>

        {/* Status Card */}
        <section className={`mb-8 overflow-hidden rounded-2xl border ${isCritical ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20' : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20'} p-8 shadow-sm transition-colors duration-500`}>
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full ${isCritical ? 'bg-red-100 dark:bg-red-900/50' : 'bg-emerald-100 dark:bg-emerald-900/50'}`}>
              {isCritical ? (
                <AlertTriangle className="h-10 w-10 text-red-600" />
              ) : (
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              )}
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${isCritical ? 'text-red-900 dark:text-red-100' : 'text-emerald-900 dark:text-emerald-100'}`}>
                Flood Level: {isCritical ? "CRITICAL" : "NORMAL"}
              </h2>
              <p className={`text-lg ${isCritical ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                {isCritical 
                  ? "Emergency sensors have triggered the relief fund. Eligible residents can now claim grants."
                  : "All monitored sensors report safe levels. Stay safe and prepared."}
              </p>
            </div>
            {fetching && <Loader2 className="h-6 w-6 animate-spin text-slate-400" />}
          </div>
        </section>

        {/* Resident Dashboard */}
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-8 flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Resident Dashboard</h3>
          </div>

          {!address ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                <Wallet className="h-8 w-8 text-slate-400" />
              </div>
              <h4 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Wallet Not Connected</h4>
              <p className="mb-6 text-slate-600 dark:text-slate-400">Connect your Freighter wallet to check your eligibility for relief funds.</p>
              <button onClick={handleConnect} className="rounded-xl bg-blue-600 px-8 py-3 font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-95">
                Connect Now
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Registration Status</span>
                  <div className="mt-1 flex items-center gap-2">
                    {isRegistered ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                        <span className="font-bold text-slate-900 dark:text-white">Registered Resident</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-5 w-5 text-amber-500" />
                        <span className="font-bold text-slate-900 dark:text-white">Not Registered</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Relief Claim Status</span>
                  <div className="mt-1 flex items-center gap-2">
                    {hasClaimed ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-blue-500" />
                        <span className="font-bold text-slate-900 dark:text-white">Funds Claimed</span>
                      </>
                    ) : (
                      <>
                        <Info className="h-5 w-5 text-slate-400" />
                        <span className="font-bold text-slate-900 dark:text-white">Not Yet Claimed</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  disabled={!isCritical || !isRegistered || hasClaimed || loading}
                  onClick={handleClaim}
                  className="w-full flex items-center justify-center gap-3 rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none dark:disabled:bg-slate-800"
                >
                  {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                  {hasClaimed ? "Grant Received" : "Claim 50 USDC Relief"}
                </button>
                {statusMessage && (
                  <p className="mt-4 text-center text-sm font-medium text-blue-600 dark:text-blue-400">
                    {statusMessage}
                  </p>
                )}
                <p className="mt-4 text-center text-xs text-slate-500">
                  {!isCritical && "Relief claims are only open during critical flood levels."}
                  {isCritical && !isRegistered && "You must be pre-registered by an NGO admin to claim funds."}
                  {isCritical && isRegistered && hasClaimed && "You have already received your emergency grant for this event."}
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="mt-auto border-t border-slate-200 bg-white px-4 py-12 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-slate-500">© 2026 FloodGuard Instant Relief Platform</p>
        <p className="mt-2 text-xs text-slate-400">Powered by Stellar & Soroban</p>
      </footer>
    </div>
  );
}
