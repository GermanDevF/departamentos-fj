"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getDirecciones,
  createDireccion,
  updateDireccion,
  deleteDireccion,
} from "@/lib/direcciones/actions";
import type {
  Direccion,
  CreateDireccionInput,
  UpdateDireccionInput,
} from "@/types";

export function useDirecciones() {
  const [direcciones, setDirecciones] = useState<Direccion[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await getDirecciones();
    if (result.success && result.data) {
      setDirecciones(result.data);
    }
    setLoading(false);
  }, []);

  const create = useCallback(
    async (input: CreateDireccionInput) => {
      const result = await createDireccion(input);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, input: UpdateDireccionInput) => {
      const result = await updateDireccion(id, input);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const result = await deleteDireccion(id);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  return { direcciones, loading, create, update, remove, refresh };
}
