"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount, useSwitchChain } from "wagmi";
import { useReadContract } from "wagmi";
import { CHAIN_ID } from "@/lib/constants";
import { BHS_ABI } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { useRegister } from "@/hooks/useRegister";
import { shortAddress } from "@/lib/formatters";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

export default function RefPage() {
  const params  = useParams();
  const router  = useRouter();
  const refAddr = params.address as `0x${string}`;

  const { address, isConnected, chainId } = useAccount();
  const { register, isPending, isSuccess, error: regError } = useRegister();
  const { switchChainAsync } = useSwitchChain();
  const wrongNetwork = isConnected && chainId !== CHAIN_ID;

  // Check if referrer is registered
  const { data: refStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BHS_ABI,
    functionName: "getStats",
    args: refAddr ? [refAddr] : undefined,
    query: { enabled: !!refAddr },
  });

  // Check if current user is already registered
  const { data: myStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BHS_ABI,
    functionName: "getStats",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  type StatsResult = readonly [string, boolean, readonly boolean[], boolean, bigint, bigint, bigint];
  const refIsRegistered = refStats && (refStats as StatsResult)[1];

  // Save referrer to localStorage so dashboard can use it later
  useEffect(() => {
    if (refAddr) {
      localStorage.setItem("bee_ref", refAddr);
    }
  }, [refAddr]);

  useEffect(() => {
    if (isSuccess) {
      localStorage.removeItem("bee_ref");
      toast.success("Добро пожаловать в рой! 🐝");
      setTimeout(() => router.push("/dashboard"), 2000);
    }
  }, [isSuccess, router]);

  useEffect(() => {
    type StatsResult = readonly [string, boolean, readonly boolean[], boolean, bigint, bigint, bigint];
    if (myStats && (myStats as StatsResult)[1]) {
      router.push("/dashboard");
    }
  }, [myStats, router]);

  return (
    <div className="min-h-screen bg-bg honeycomb-bg flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🐝</div>
          <h1 className="text-3xl font-extrabold text-gold text-glow-gold">META BEE HIVE</h1>
          <p className="text-white/50 text-sm mt-2">Тебя пригласили в рой</p>
        </div>

        {/* Card */}
        <div className="bg-navy rounded-3xl border border-white/10 p-6 space-y-6">
          {/* Referrer info */}
          <div className="bg-bg rounded-2xl p-4 border border-gold/20 text-center">
            <p className="text-white/40 text-xs mb-1">Пригласил</p>
            <p className="text-gold font-mono font-bold">{shortAddress(refAddr)}</p>
            {refIsRegistered ? (
              <span className="mt-2 inline-block text-xs bg-bee-green/20 text-bee-green px-2 py-0.5 rounded-full">
                ✓ Активная пчела
              </span>
            ) : (
              <span className="mt-2 inline-block text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">
                Не зарегистрирован
              </span>
            )}
          </div>

          {/* Steps */}
          <div className="space-y-3 text-sm">
            {[
              "Подключи кошелёк Polygon",
              "Нажми «Вступить в рой»",
              "Подтверди транзакцию",
              "Купи первый Hive H1 за 5 DAI",
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80 font-medium">
                <div className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </div>
                {s}
              </div>
            ))}
          </div>

          {/* Status */}
          {isSuccess && (
            <div className="text-center text-bee-green bg-bee-green/10 rounded-xl py-3 text-sm">
              <CheckCircle2 className="w-5 h-5 inline mr-2" />
              Добро пожаловать в рой!
            </div>
          )}
          {regError && regError !== "cancelled" && (
            <div className="text-center text-white/70 bg-white/10 rounded-xl py-3 text-sm">
              Transaction failed. Please try again.
            </div>
          )}

          {/* Action */}
          {!isConnected ? (
            <ConnectButton />
          ) : isPending ? (
            <Button variant="navy" size="lg" className="w-full" disabled>
              <Loader2 className="w-4 h-4 animate-spin" />
              Ожидаем подтверждения...
            </Button>
          ) : !isSuccess ? (
            wrongNetwork ? (
              <button
                className="w-full rounded-2xl py-4 flex items-center justify-center gap-3"
                style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.4)" }}
                onClick={() => switchChainAsync({ chainId: CHAIN_ID })}
              >
                <span className="text-xl font-black text-white">⚠️ Переключить на Polygon</span>
              </button>
            ) : (
              <button
                className="w-full rounded-2xl py-4 flex items-center justify-center gap-3"
                style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.4)" }}
                onClick={() => register(refAddr)}
              >
                <ArrowRight className="w-5 h-5 text-white" />
                <span className="text-xl font-black text-white">Вступить в рой</span>
              </button>
            )
          ) : null}
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full mt-4 text-white font-bold text-sm hover:text-gold transition-colors py-2"
        >
          Посмотреть приложение →
        </button>

        <p className="text-center text-white/20 text-xs mt-2">
          Смарт-контракт на Polygon · DAI · Прозрачные выплаты
        </p>
      </div>
    </div>
  );
}
