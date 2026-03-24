"use client";
import { useState } from "react";
import { useWriteContract } from "wagmi";
import { BHS_ABI } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
import { Zap } from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

interface AutoBuyToggleProps {
  enabled: boolean;
  onToggled?: () => void;
}

export function AutoBuyToggle({ enabled, onToggled }: AutoBuyToggleProps) {
  const [pending, setPending] = useState(false);
  const { writeContractAsync } = useWriteContract();

  async function toggle() {
    setPending(true);
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: BHS_ABI,
        functionName: "setAutoBuy",
        args: [!enabled],
      });
      toast.success(enabled ? "Автопокупка отключена" : "Автопокупка включена 🐝");
      onToggled?.();
    } catch {
      toast.error("Транзакция отменена");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="flex items-center justify-between">
      <div className="flex items-start gap-3">
        <div className={clsx("p-2 rounded-lg mt-0.5", enabled ? "bg-bee-green/20" : "bg-white/5")}>
          <Zap className={clsx("w-4 h-4", enabled ? "text-bee-green" : "text-white/40")} />
        </div>
        <div>
          <p className="font-medium text-white text-sm">Автопокупка улия</p>
          <p className="text-white/40 text-xs mt-0.5">
            Выплаты накапливаются для покупки улия — и он покупается автоматически
          </p>
        </div>
      </div>

      <button
        onClick={toggle}
        disabled={pending}
        className={clsx(
          "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 transition-colors duration-200 ease-in-out",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          enabled ? "bg-bee-green border-bee-green" : "bg-white/20 border-white/20"
        )}
      >
        <span
          className={clsx(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out mt-0.5",
            enabled ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </Card>
  );
}
