"use client";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { injected } from "wagmi/connectors";
import { useState, useEffect } from "react";
import { Wallet, ChevronDown, LogOut, AlertTriangle, X, KeyRound, Loader2 } from "lucide-react";

function TelegramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/>
    </svg>
  );
}
import { shortAddress } from "@/lib/formatters";
import { CHAIN_ID } from "@/lib/constants";
import { clsx } from "clsx";
import { useOpenfortContext } from "@/components/providers/OpenfortContext";

const SITE = "metabeehive.com";

const WALLETS = [
  {
    id:   "metaMask",
    icon: "🦊",
    name: "MetaMask",
    url:  `https://metamask.app.link/dapp/${SITE}`,
  },
  {
    id:   "trust",
    icon: "🛡️",
    name: "Trust Wallet",
    url:  `https://link.trustwallet.com/open_url?coin_id=966&url=https://${SITE}`,
  },
];

function openDeepLink(url: string) {
  const tg = (window as any).Telegram?.WebApp;
  if (tg) tg.openLink(url);
  else window.open(url, "_blank");
}

/** Email OTP modal for Openfort login */
function EmailOTPModal({ onClose }: { onClose: () => void }) {
  const { loginWithEmail, verifyEmailOTP, isLoading, otpSent, error, resetOtp } = useOpenfortContext();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  function handleClose() {
    resetOtp();
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div
        className="fixed z-50 left-1/2 -translate-x-1/2 bottom-6 w-[calc(100%-2rem)] max-w-sm rounded-3xl p-5 space-y-3"
        style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-white font-bold text-sm">
            {otpSent ? "Введите код из письма" : "Войти по email"}
          </p>
          <button onClick={handleClose} className="text-white/30 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
        )}

        {!otpSent ? (
          <>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none"
            />
            <button
              onClick={() => loginWithEmail(email)}
              disabled={isLoading || !email}
              className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)", color: "#fff" }}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Отправить код"}
            </button>
          </>
        ) : (
          <>
            <p className="text-white/40 text-xs">Код отправлен на {email}</p>
            <input
              type="text"
              placeholder="Код из письма"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10 outline-none"
            />
            <button
              onClick={() => verifyEmailOTP(email, otp)}
              disabled={isLoading || !otp}
              className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50"
              style={{ background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)", color: "#fff" }}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Подтвердить"}
            </button>
            <button onClick={resetOtp} className="w-full text-xs text-white/30 hover:text-white/50 pt-1">
              ← Изменить email
            </button>
          </>
        )}
      </div>
    </>
  );
}

export function ConnectButton() {
  const { address, isConnected, chainId } = useAccount();
  const { connect }     = useConnect();
  const { disconnect }  = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { isAuthenticated, isLoading: openfortLoading, loginWithTelegram, logout: openfortLogout } = useOpenfortContext();

  const [open, setOpen]           = useState(false);
  const [modal, setModal]         = useState(false);
  const [hasInjected, setHasInjected] = useState(false);
  const [isTelegram, setIsTelegram]   = useState(false);

  useEffect(() => {
    setHasInjected(!!(window as any).ethereum);
    setIsTelegram(!!(window as any).Telegram?.WebApp);
  }, []);

  const wrongNetwork = isConnected && chainId !== CHAIN_ID;

  const btnStyle = {
    background: "linear-gradient(135deg, #F5A623, #FF8C00)",
    color: "#000",
    boxShadow: "0 0 20px rgba(245,166,35,0.3)",
  };

  if (!isConnected) {
    // Telegram — используем Openfort (embedded wallet + газ)
    if (isTelegram) {
      return (
        <button
          onClick={loginWithTelegram}
          disabled={openfortLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          style={{ background: "#2AABEE", color: "#fff", boxShadow: "0 0 20px rgba(42,171,238,0.3)" }}
        >
          {openfortLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TelegramIcon />}
          Войти через Telegram
        </button>
      );
    }

    // Browser с кошельком — инжектед
    if (hasInjected) {
      return (
        <>
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            style={btnStyle}
          >
            <Wallet className="w-4 h-4" />
            Connect
          </button>

          {modal && (
            <>
              <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setModal(false)} />
              <div
                className="fixed z-50 left-1/2 -translate-x-1/2 bottom-6 w-[calc(100%-2rem)] max-w-sm rounded-3xl p-5 space-y-3"
                style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-white font-bold text-sm">Connect Wallet</p>
                  <button onClick={() => setModal(false)} className="text-white/30 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => { setModal(false); loginWithTelegram(); }}
                  disabled={openfortLoading}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all hover:opacity-80 disabled:opacity-50"
                  style={{ background: "rgba(42,171,238,0.12)", border: "1px solid rgba(42,171,238,0.3)" }}
                >
                  <span className="text-[#2AABEE]"><TelegramIcon /></span>
                  <span className="text-white font-semibold text-sm">Войти через Telegram</span>
                </button>
                <button
                  onClick={() => { connect({ connector: injected() }); setModal(false); }}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <span className="text-2xl">🦊</span>
                  <span className="text-white font-semibold text-sm">MetaMask / Browser Wallet</span>
                </button>
                <p className="text-white/20 text-xs text-center pt-1">Polygon · DAI</p>
              </div>
            </>
          )}
        </>
      );
    }

    // Нет кошелька — deeplinks + email
    return (
      <>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={btnStyle}
        >
          <Wallet className="w-4 h-4" />
          Connect
        </button>

        {modal && (
          <>
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setModal(false)} />
            <div
              className="fixed z-50 left-1/2 -translate-x-1/2 bottom-6 w-[calc(100%-2rem)] max-w-sm rounded-3xl p-5 space-y-3"
              style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-white font-bold text-sm">Connect Wallet</p>
                <button onClick={() => setModal(false)} className="text-white/30 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => { setModal(false); loginWithTelegram(); }}
                disabled={openfortLoading}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all hover:opacity-80 disabled:opacity-50"
                style={{ background: "rgba(42,171,238,0.12)", border: "1px solid rgba(42,171,238,0.3)" }}
              >
                <span className="text-[#2AABEE]"><TelegramIcon /></span>
                <span className="text-white font-semibold text-sm">Войти через Telegram</span>
              </button>

              {WALLETS.map((w) => (
                <button
                  key={w.id}
                  onClick={() => openDeepLink(w.url)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all hover:opacity-80"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <span className="text-2xl">{w.icon}</span>
                  <span className="text-white font-semibold text-sm">{w.name}</span>
                </button>
              ))}

              <p className="text-white/20 text-xs text-center pt-1">Polygon · DAI</p>
            </div>
          </>
        )}
      </>
    );
  }

  if (wrongNetwork) {
    return (
      <button
        onClick={() => switchChain({ chainId: CHAIN_ID })}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white/10 border border-white/20 text-white transition-all hover:bg-white/15"
      >
        <AlertTriangle className="w-4 h-4" />
        Switch Network
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "rgba(255,255,255,0.85)",
        }}
      >
        <div className="w-5 h-5 rounded-full bg-gold/30 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-gold" />
        </div>
        <span className="font-mono text-xs">{shortAddress(address!)}</span>
        <ChevronDown className={clsx("w-3.5 h-3.5 text-white/40 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-11 z-20 w-52 rounded-xl overflow-hidden"
            style={{ background: "#10101e", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {isAuthenticated && (
              <button
                onClick={() => { setOpen(false); setEmailModal(true); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all border-b border-white/5"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Ключ импорта в другой кошелёк
              </button>
            )}
            <button
              onClick={() => {
                disconnect();
                if (isAuthenticated) openfortLogout();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        </>
      )}
    </div>
  );
}
