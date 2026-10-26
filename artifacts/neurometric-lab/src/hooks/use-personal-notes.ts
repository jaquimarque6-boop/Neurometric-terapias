import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import type { PersonalNote } from "@/lib/personal-notes";

export type CreatePersonalNote = {
  content: string;
  reminderDate?: string | null;
};

export type UpdatePersonalNote = Partial<Pick<
  PersonalNote,
  "content" | "reminderDate" | "isPinned" | "isCompleted"
>>;

const personalNotesKey = (userId: number | undefined) => ["personal-notes", userId] as const;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}/api/personal-notes${path}`, {
    credentials: "include",
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error ?? "No se pudo completar la operación con la nota.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function usePersonalNotes() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();
  const queryKey = personalNotesKey(userId);

  const query = useQuery({
    queryKey,
    enabled: Boolean(userId && (user?.role === "admin" || user?.role === "professional")),
    queryFn: () => request<PersonalNote[]>(""),
  });

  const create = useMutation({
    mutationFn: (input: CreatePersonalNote) => request<PersonalNote>("", {
      method: "POST",
      body: JSON.stringify(input),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const update = useMutation({
    mutationFn: ({ id, ...input }: UpdatePersonalNote & { id: number }) =>
      request<PersonalNote>(`/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => request<void>(`/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    notes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createNote: create.mutateAsync,
    updateNote: update.mutateAsync,
    deleteNote: remove.mutateAsync,
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
  };
}
