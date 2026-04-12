"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty,
} from "@/lib/properties/actions";
import type {
  Property,
  CreatePropertyInput,
  UpdatePropertyInput,
} from "@/types";

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await getProperties();
    if (result.success && result.data) {
      setProperties(result.data);
    }
    setLoading(false);
  }, []);

  const create = useCallback(
    async (input: CreatePropertyInput) => {
      const result = await createProperty(input);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const update = useCallback(
    async (id: string, input: UpdatePropertyInput) => {
      const result = await updateProperty(id, input);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      const result = await deleteProperty(id);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { properties, loading, create, update, remove, refresh };
}
