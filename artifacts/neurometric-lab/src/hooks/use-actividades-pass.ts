import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE, getAuthToken } from "@/lib/api";
import { ACTIVIDADES_URL } from "@/lib/actividades";

export function useActividadesPass() {
  const { toast } = useToast();
  const [openingActivities, setOpeningActivities] = useState(false);

  const openActivities = async () => {
    const activitiesWindow = window.open("about:blank", "_blank");
    if (!activitiesWindow) {
      toast({
        title: "El navegador bloqueó la nueva pestaña",
        description: "Permite las ventanas emergentes para abrir Actividades.",
        variant: "destructive",
      });
      return;
    }

    activitiesWindow.opener = null;
    setOpeningActivities(true);
    try {
      const headers = new Headers();
      const token = getAuthToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const response = await fetch(`${API_BASE}/api/actividades/pase`, {
        method: "POST",
        credentials: "include",
        headers,
      });

      if (response.status === 402) {
        activitiesWindow.close();
        toast({ title: "Tu suscripción no está activa.", variant: "destructive" });
        return;
      }
      if (!response.ok) throw new Error("Pass request failed");

      const result: unknown = await response.json();
      const pase = typeof result === "object" && result !== null && "pase" in result
        ? (result as { pase?: unknown }).pase
        : null;
      if (typeof pase !== "string" || !pase) throw new Error("Invalid pass response");

      activitiesWindow.location.href = `${ACTIVIDADES_URL}/#pase=${encodeURIComponent(pase)}`;
    } catch {
      activitiesWindow.close();
      toast({
        title: "No se pudo abrir Actividades. Probá de nuevo.",
        variant: "destructive",
      });
    } finally {
      setOpeningActivities(false);
    }
  };

  return { openActivities, openingActivities };
}
