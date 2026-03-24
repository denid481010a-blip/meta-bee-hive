"use client";
import { useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { HIVE_PRICES_DAI, HIVE_PRICES_WEI, LEVEL_COLORS } from "@/lib/constants";
import { useBuyLevel } from "@/hooks/useBuyLevel";
import { useReadContract } from "wagmi";
import { BHS_ABI } from "@/lib/contract";
import { CONTRACT_ADDRESS } from "@/lib/constants";
import { shortAddress } from "@/lib/formatters";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

interface BuyLevelModalProps {
  level:    number | null;
  address?: `0x${string}`;
  onClose:  () => void;
  onSuccess: () => void;
}

const STEP_LABELS = {
  idle:            "Готов к покупке",
  approving:       "Подтвердите approve DAI в кошельке...",
  approve_pending: "Ожидаем подтверждения approve...",
  buying:          "Подтвердите покупку в кошельке...",
  buy_pending:     "Ожидаем подтверждения покупки...",
  success:         "Куплено!",
  error:           "Ошибка",
};

export function BuyLevelModal({ level, address, onClose, onSuccess }: BuyLevelModalProps) {
  const { step, error, buy, reset } = useBuyLevel();
  const color   = LEVEL_COLORS[level ?? 1] ?? "#F5A623";
  const price   = level ? HIVE_PRICES_DAI[level - 1] : 0;
  const priceWei = level ? HIVE_PRICES_WEI[level - 1] : 0n;

  // Превью аплайна
  const { data: upline } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: BHS_ABI,
    functionName: "previewUpline",
    args: address && level ? [address, level] : undefined,
    query: { enabled: !!address && !!level },
  });

  useEffect(() => {
    if (step === "success") {
      toast.success(`Hive ${level} активирован! 🐝`);
      onSuccess();
      setTimeout(() => { reset(); onClose(); }, 2000);
    }
  }, [step]);

  const isLoading = ["approving", "approve_pending", "buying", "buy_pending"].includes(step);

  return (
    <Modal open={!!level} onClose={!isLoading ? onClose : () => {}} title={`Купить Hive ${level}`}>
      {level && (
        <div className="space-y-4">
          {/* Level info */}
          <div
            className="rounded-xl border p-4 text-center"
            style={{ borderColor: color + "44", backgroundColor: color + "11" }}
          >
            <p className="text-4xl mb-1">🐝</p>
            <h3 className="font-bold text-2xl" style={{ color }}>Hive {level}</h3>
            <p className="text-white/60 text-sm mt-1">Цена: {price} DAI</p>
          </div>

          {/* Upline preview */}
          {upline && (
            <div className="flex items-center justify-between bg-bg rounded-xl p-3 text-sm">
              <span className="text-white/50">Выплата пойдёт:</span>
              <span className="text-gold font-mono">{shortAddress(upline)}</span>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-2">
            {[
              { key: ["idle", "approving", "approve_pending", "buying", "buy_pending", "success"], label: "Шаг 1: Approve DAI",   done: ["buying", "buy_pending", "success"].includes(step) },
              { key: ["buying", "buy_pending", "success"],                                         label: "Шаг 2: Купить Hive",   done: step === "success" },
            ].map(({ label, done }, i) => (
              <div key={i} className={clsx("flex items-center gap-3 p-3 rounded-xl border text-sm", done ? "border-bee-green/30 bg-bee-green/5" : "border-white/10")}>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-bee-green flex-shrink-0" />
                  : <div className="w-4 h-4 rounded-full border border-white/30 flex-shrink-0" />
                }
                <span className={done ? "text-bee-green" : "text-white/60"}>{label}</span>
              </div>
            ))}
          </div>

          {/* Status */}
          <div className={clsx(
            "text-center text-sm py-2 px-4 rounded-xl",
            step === "success" ? "text-bee-green bg-bee-green/10" :
            step === "error"   ? "text-white/70 bg-white/10"     :
            "text-white/50"
          )}>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin inline mr-2" />}
            {error ?? STEP_LABELS[step]}
          </div>

          {/* Action button */}
          {step === "idle" || step === "error" ? (
            <Button
              variant="gold"
              size="lg"
              className="w-full"
              onClick={() => buy(level, priceWei)}
            >
              <ArrowRight className="w-4 h-4" />
              {step === "error" ? "Попробовать снова" : `Купить Hive ${level} за ${price} DAI`}
            </Button>
          ) : step === "success" ? (
            <Button variant="navy" size="lg" className="w-full" onClick={onClose}>
              <CheckCircle2 className="w-4 h-4 text-bee-green" />
              Готово!
            </Button>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
