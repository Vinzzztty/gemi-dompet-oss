import { del, get, post, put } from '@/lib/http';
import { API_ENDPOINTS } from '@/lib/constants';
import type { ApiResponse } from '@/types/api';

export type SplitBillSessionStatus = 'OPEN' | 'CLOSED' | 'ARCHIVED';

export type SplitBillOwnerDto = {
  id: string;
  email: string;
  fullName: string;
};

export type SplitBillParticipantDto = {
  id: string;
  sessionId: string;
  userId: string | null;
  displayName: string;
  isOwner: boolean;
  joinedViaCode: boolean;
  createdAt: string;
  updatedAt: string;
  user?: SplitBillOwnerDto | null;
};

export type SplitBillShareDto = {
  id: string;
  sessionId: string;
  participantId: string;
  amount: string | number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  participant: {
    id: string;
    displayName: string;
    userId: string | null;
    isOwner: boolean;
    joinedViaCode: boolean;
  };
};

export type SplitBillSessionDto = {
  id: string;
  ownerUserId: string;
  sessionCode: string;
  title: string;
  totalAmount: string | number;
  currency: string;
  status: SplitBillSessionStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  owner: SplitBillOwnerDto;
  participants: SplitBillParticipantDto[];
  shares: SplitBillShareDto[];
};

export type CreateSplitBillSessionRequest = {
  title: string;
  totalAmount: number;
  currency?: string;
  notes?: string | null;
};

export type JoinSplitBillSessionRequest = {
  sessionCode: string;
  displayName: string;
};

export type UpsertSplitBillParticipantRequest = {
  displayName: string;
};

export type UpdateSplitBillSharesRequest = {
  mode: 'equal' | 'manual';
  shares?: Array<{
    participantId: string;
    amount: number;
    notes?: string | null;
  }>;
};

const buildSessionDetailPath = (sessionCode: string) =>
  `${API_ENDPOINTS.SPLIT_BILL_SESSIONS}/${encodeURIComponent(sessionCode)}`;

export const splitBillService = {
  async listOwnedSessions() {
    return get<ApiResponse<SplitBillSessionDto[]>>(
      API_ENDPOINTS.SPLIT_BILL_SESSIONS,
    );
  },

  async createSession(body: CreateSplitBillSessionRequest) {
    return post<ApiResponse<SplitBillSessionDto>>(
      API_ENDPOINTS.SPLIT_BILL_SESSIONS,
      body,
    );
  },

  async getSessionByCode(sessionCode: string) {
    return get<ApiResponse<SplitBillSessionDto>>(
      buildSessionDetailPath(sessionCode),
    );
  },

  async joinSession(body: JoinSplitBillSessionRequest) {
    return post<ApiResponse<SplitBillSessionDto>>(
      API_ENDPOINTS.SPLIT_BILL_JOIN,
      body,
    );
  },

  async addParticipant(
    sessionCode: string,
    body: UpsertSplitBillParticipantRequest,
  ) {
    return post<ApiResponse<SplitBillSessionDto>>(
      `${buildSessionDetailPath(sessionCode)}/participants`,
      body,
    );
  },

  async removeParticipant(sessionCode: string, participantId: string) {
    return del<ApiResponse<SplitBillSessionDto>>(
      `${buildSessionDetailPath(sessionCode)}/participants/${participantId}`,
    );
  },

  async updateShares(
    sessionCode: string,
    body: UpdateSplitBillSharesRequest,
  ) {
    return put<ApiResponse<SplitBillSessionDto>>(
      `${buildSessionDetailPath(sessionCode)}/shares`,
      body,
    );
  },
};
