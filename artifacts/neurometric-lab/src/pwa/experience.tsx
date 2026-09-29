import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { Workbox } from "workbox-window";
import { createUpdateGate } from "./update-gate";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallMode = "native" | "ios" | "ios-other" | null;
interface PwaState {
  installMode: InstallMode;
  install: () => Promise<void>;
  updateAvailable: boolean;
  update: () => Promise<void>;
  online: boolean;
}

const Context = createContext<PwaState>({
  installMode: null, install: async () => {}, updateAvailable: false,
  update: async () => {}, online: true,
});

export const usePwa = () => useContext(Context);

export function PwaExperience({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(navigator.onLine);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(
    window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true),
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const [applyUpdate, setApplyUpdate] = useState<(() => void) | null>(null);
  const [retryStatus, setRetryStatus] = useState("");

  useEffect(() => {
    const syncOnline = () => setOnline(navigator.onLine);
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    const onInstalled = () => { setInstalled(true); setInstallEvent(null); };
    window.addEventListener("online", syncOnline);
    window.addEventListener("offline", syncOnline);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("online", syncOnline);
      window.removeEventListener("offline", syncOnline);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    const workbox = new Workbox(`${import.meta.env.BASE_URL}sw.js`, {
      scope: import.meta.env.BASE_URL,
      type: "classic",
    });
    const gate = createUpdateGate(() => window.location.reload());
    let registration: ServiceWorkerRegistration | undefined;
    let disposed = false;
    const onWaiting = () => { if (!disposed) setUpdateAvailable(true); };
    const onControlling = (event: { isUpdate?: boolean }) => {
      if (!gate.onControlling() && event.isUpdate && !disposed) {
        // Another tab activated a version. Keep this tab's forms intact;
        // offer an explicit reload to use the new version here.
        setUpdateAvailable(true);
      }
    };
    workbox.addEventListener("waiting", onWaiting);
    workbox.addEventListener("controlling", onControlling);

    // Workbox can update a worker activated in another tab. The controlling
    // event NEVER reloads this tab unless this tab accepted the update itself.
    setApplyUpdate(() => () => {
      if (registration?.waiting) {
        gate.accept(() => registration?.waiting?.postMessage({ type: "SKIP_WAITING" }));
      } else {
        // Another tab may have already activated the update. Only an explicit
        // click in THIS tab is allowed to reload it.
        window.location.reload();
      }
    });
    const check = () => {
      if (!disposed && navigator.onLine && document.visibilityState === "visible") {
        void workbox.update().catch(() => {});
      }
    };
    const timer = window.setInterval(check, 60 * 60 * 1000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    void workbox.register({ immediate: true }).then((result) => {
      if (disposed) return;
      registration = result;
      if (result?.waiting && navigator.serviceWorker.controller) setUpdateAvailable(true);
      check();
    }).catch(() => {});
    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
      workbox.removeEventListener("waiting", onWaiting);
      workbox.removeEventListener("controlling", onControlling);
    };
  }, []);

  useLayoutEffect(() => {
    document.body.classList.toggle("nm-offline", !online);
    return () => document.body.classList.remove("nm-offline");
  }, [online]);

  const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(navigator.userAgent);
  const installMode: InstallMode = installed ? null : installEvent ? "native" : isIOS ? (isSafari ? "ios" : "ios-other") : null;

  const install = async () => {
    if (installEvent) {
      await installEvent.prompt();
      await installEvent.userChoice;
      setInstallEvent(null);
    } else if (isIOS) setIosHelp(true);
  };

  return (
    <Context.Provider value={{ installMode, install, updateAvailable, update: async () => {
      applyUpdate?.();
    }, online }}>
      <div className={online ? "" : "nm-offline-content"} inert={!online}>
        {children}
      </div>
      {!online && (
        <div className="nm-offline-screen" role="alert" aria-live="assertive">
          <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} width="72" height="72" alt="" />
          <h1>Necesitás conexión para usar Neurometric</h1>
          <p>Por seguridad, la información clínica no está disponible sin internet. Revisá tu conexión y volvé a intentarlo.</p>
          {retryStatus && <p role="status">{retryStatus}</p>}
          <button type="button" onClick={() => {
            if (navigator.onLine) {
              setRetryStatus("");
              setOnline(true);
            } else {
              setRetryStatus("Todavía no hay conexión. Tus cambios permanecen en esta ventana; intentá nuevamente cuando vuelva internet.");
            }
          }}>Reintentar</button>
        </div>
      )}
      {online && updateAvailable && (
        <div className="nm-update-notice" role="status">
          <span>Nueva versión de Neurometric disponible. Guardá tus cambios y cerrá otras pestañas antes de actualizar.</span>
          <button type="button" onClick={() => {
            if (window.confirm("¿Guardaste tus cambios y cerraste otras pestañas de Neurometric? La aplicación se recargará para actualizarse.")) {
              applyUpdate?.();
            }
          }}>Actualizar</button>
          <button type="button" aria-label="Posponer actualización" onClick={() => {
            setUpdateAvailable(false);
            window.setTimeout(() => setUpdateAvailable(true), 60 * 60 * 1000);
          }}>Ahora no</button>
        </div>
      )}
      {iosHelp && online && (
        <div className="nm-install-help" role="dialog" aria-modal="true" aria-label="Instalar Neurometric">
          <div>
            <h2>Instalar Neurometric</h2>
            <p>{isSafari ? "En Safari, tocá Compartir → Agregar a pantalla de inicio." : "Abrí Neurometric en Safari y tocá Compartir → Agregar a pantalla de inicio."}</p>
            <button type="button" onClick={() => setIosHelp(false)}>Entendido</button>
          </div>
        </div>
      )}
    </Context.Provider>
  );
}