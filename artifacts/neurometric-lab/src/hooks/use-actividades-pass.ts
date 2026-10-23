import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE, getAuthToken } from "@/lib/api";
import {
  ActivitiesSubscriptionInactiveError,
  requestActivitiesAccessUrl,
} from "@/lib/actividades-pass-client";

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
      activitiesWindow.location.href = await requestActivitiesAccessUrl(API_BASE, getAuthToken());
    } catch (error) {
      activitiesWindow.close();
      if (error instanceof ActivitiesSubscriptionInactiveError) {
        toast({ title: "Tu suscripción no está activa.", variant: "destructive" });
      } else {
        toast({
          title: "No se pudo abrir Actividades. Probá de nuevo.",
          variant: "destructive",
        });
      }
    } finally {
      setOpeningActivities(false);
    }
  };

  return { openActivities, openingActivities };
}
