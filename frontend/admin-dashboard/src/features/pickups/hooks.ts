import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPickupApi,
  updatePickupApi,
  getPickupApi,
  assignCourierApi,
  listPickupsApi,
  searchPickupsApi,
} from "./api";
import { pickupQueryKeys } from "./query-keys";
import type { PickupFilter, PickupRequestDTO } from "./types";

export const usePickupsQuery = (page?: number, size?: number) => {
  return useQuery({
    queryKey: pickupQueryKeys.list(page, size),
    queryFn: () => listPickupsApi(page, size),
    staleTime: 30 * 1000,
  });
};

export const usePickupDetailQuery = (id: number) => {
  return useQuery({
    queryKey: pickupQueryKeys.detail(id),
    queryFn: () => getPickupApi(id),
    enabled: id > 0,
  });
};

export const useSearchPickupsQuery = (params: PickupFilter) => {
  return useQuery({
    queryKey: pickupQueryKeys.search(params),
    queryFn: () => searchPickupsApi(params),
    staleTime: 30 * 1000,
    enabled:
      Boolean(params.status) ||
      params.MERCHANTId !== undefined ||
      params.courierProfileId !== undefined ||
      params.branchId !== undefined,
  });
};

export const useCreatePickupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPickupApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pickupQueryKeys.all });
    },
  });
};

export const useUpdatePickupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: PickupRequestDTO;
    }) => updatePickupApi(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: pickupQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: pickupQueryKeys.all });
    },
  });
};

export const useAssignCourierMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      courierId,
    }: {
      id: number;
      courierId: number;
    }) => assignCourierApi(id, courierId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: pickupQueryKeys.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: pickupQueryKeys.all });
    },
  });
};
