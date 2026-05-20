import apiClient from "@/utils/axios";
import type {
  PickupRequestDTO,
  PickupFilter,
  PickupPageResponse,
} from "./types";

export const createPickupApi = async (
  data: PickupRequestDTO,
): Promise<PickupRequestDTO> => {
  const response = await apiClient.post("/api/pickups", data);
  return response.data;
};

export const updatePickupApi = async (
  id: number,
  data: PickupRequestDTO,
): Promise<PickupRequestDTO> => {
  const response = await apiClient.put(`/api/pickups/${id}`, data);
  return response.data;
};

export const getPickupApi = async (id: number): Promise<PickupRequestDTO> => {
  const response = await apiClient.get(`/api/pickups/${id}`);
  return response.data;
};

export const assignCourierApi = async (
  id: number,
  courierId: number,
): Promise<PickupRequestDTO> => {
  const response = await apiClient.put(
    `/api/pickups/${id}/assign`,
    null,
    { params: { courierId } },
  );
  return response.data;
};

export const listPickupsApi = async (
  page?: number,
  size?: number,
): Promise<PickupPageResponse> => {
  const response = await apiClient.get("/api/pickups/search", {
    params: { page: page ?? 0, size: size ?? 10 },
  });
  return response.data;
};

export const searchPickupsApi = async (
  params: PickupFilter,
): Promise<PickupPageResponse> => {
  const queryParams = new URLSearchParams();

  if (params.status) queryParams.append("status", params.status);
  if (params.MERCHANTId !== undefined)
    queryParams.append("MERCHANTId", String(params.MERCHANTId));
  if (params.courierProfileId !== undefined)
    queryParams.append("courierProfileId", String(params.courierProfileId));
  if (params.branchId !== undefined)
    queryParams.append("branchId", String(params.branchId));
  if (params.page !== undefined) queryParams.append("page", String(params.page));
  if (params.size !== undefined) queryParams.append("size", String(params.size));

  const response = await apiClient.get("/api/pickups/search", {
    params: queryParams,
  });
  return response.data;
};
