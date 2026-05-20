import { UserRole } from "@/types/enums";

export interface CreateAccountRequest {
  email: string;
  password: string;
  role: UserRole;
  profileId?: number;
}

export interface UpdateAccountRequest {
  email?: string;
  password?: string;
  role?: UserRole;
}

export interface AccountResponse {
  id: string;
  email: string;
  role: UserRole;
  createdAt?: string;
  updatedAt?: string;
  deleted?: boolean;
}

export interface Account extends AccountResponse {}

export interface ListAccountsParams {
  page: number;
  size: number;
  role?: UserRole;
  email?: string;
  includeDeleted?: boolean;
}

export interface ListAccountsResponse {
  accounts: AccountResponse[];
  totalCount: number;
  page: number;
  size: number;
  totalPages: number;
}
