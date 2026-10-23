import { useId, useMemo } from "react";
import { getListPatientsQueryKey, useListPatients } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";
import { getCoverageSuggestions } from "@/lib/coverage-suggestions";
import { Input } from "@/components/ui/input";

export function CoverageNameInput({
  id,
  value,
  onChange,
  excludePatientId,
  className,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  excludePatientId?: number;
  className?: string;
}) {
  const { user } = useAuth();
  const suggestionsId = useId();
  const isProfessional = user?.role === "professional";
  const { data: activePatients = [] } = useListPatients(undefined, {
    query: {
      enabled: isProfessional,
      queryKey: getListPatientsQueryKey(),
    },
  });
  const { data: archivedPatients = [] } = useListPatients({ includeArchived: true }, {
    query: {
      enabled: isProfessional,
      queryKey: getListPatientsQueryKey({ includeArchived: true }),
    },
  });

  const suggestions = useMemo(
    () => getCoverageSuggestions(
      [...activePatients, ...archivedPatients],
      user?.role === "professional" ? user.id : null,
      excludePatientId,
    ),
    [activePatients, archivedPatients, user?.id, user?.role, excludePatientId],
  );

  return (
    <>
      <Input
        id={id}
        data-testid={`input-${id}`}
        list={suggestionsId}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder="Nombre de la cobertura"
        className={className ?? "bg-background"}
        autoComplete="off"
      />
      <datalist id={suggestionsId} data-testid={`list-${id}-suggestions`}>
        {suggestions.map(name => (
          <option key={name.toLocaleLowerCase("es")} value={name} />
        ))}
      </datalist>
      <p data-testid={`text-${id}-hint`} className="text-[11px] text-muted-foreground">
        Podés escribir una nueva o elegir una sugerencia de tus otros pacientes.
      </p>
    </>
  );
}
