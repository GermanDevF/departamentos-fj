"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getProperties,
  createProperty,
  updateProperty,
  deleteProperty,
} from "@/lib/properties/actions";
import {
  uploadPropertyPhoto,
  deletePropertyPhoto,
} from "@/lib/properties/photo-actions";
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
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  const uploadPhoto = useCallback(
    async (propertyId: string, formData: FormData) => {
      const result = await uploadPropertyPhoto(propertyId, formData);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  const deletePhoto = useCallback(
    async (propertyId: string, storageKey: string) => {
      const result = await deletePropertyPhoto(propertyId, storageKey);
      if (result.success) await refresh();
      return result;
    },
    [refresh],
  );

  return { properties, loading, create, update, remove, uploadPhoto, deletePhoto, refresh };
}
