import { del, get, patch, post, put } from '@/lib/http';
import { API_ENDPOINTS } from '@/lib/constants';
import type { ApiResponse } from '@/types/api';

export type GroupExpenseSessionStatus =
  | 'ACTIVE'
  | 'FROZEN'
  | 'SETTLED'
  | 'ARCHIVED';

export type GroupExpenseItemStatus = 'ACTIVE' | 'VOID';
export type GroupExpenseSplitMode = 'EQUAL' | 'MANUAL';
export type GroupExpenseSettlementRole = 'RECEIVABLE' | 'PAYABLE' | 'SETTLED';

export type GroupExpenseOwnerDto = {
  id: string;
  email: string;
  fullName: string;
};

export type GroupExpenseParticipantDto = {
  id: string;
  sessionId: string;
  userId: string | null;
  displayName: string;
  isOwner: boolean;
  joinedViaCode: boolean;
  createdAt: string;
  updatedAt: string;
  user?: GroupExpenseOwnerDto | null;
};

export type GroupExpenseItemShareDto = {
  id: string;
  itemId: string;
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
  };
};

export type GroupExpenseItemDto = {
  id: string;
  sessionId: string;
  paidByParticipantId: string;
  title: string;
  locationLabel: string | null;
  amount: string | number;
  currency: string;
  incurredAt: string;
  notes: string | null;
  splitMode: GroupExpenseSplitMode;
  status: GroupExpenseItemStatus;
  createdAt: string;
  updatedAt: string;
  paidByParticipant: {
    id: string;
    displayName: string;
    userId: string | null;
    isOwner: boolean;
  };
  shares: GroupExpenseItemShareDto[];
};

export type GroupExpenseRepaymentDto = {
  id: string;
  sessionId: string;
  fromParticipantId: string;
  toParticipantId: string;
  amount: string | number;
  currency: string;
  paidAt: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  fromParticipant: {
    id: string;
    displayName: string;
    userId: string | null;
    isOwner: boolean;
  };
  toParticipant: {
    id: string;
    displayName: string;
    userId: string | null;
    isOwner: boolean;
  };
};

export type GroupExpenseSettlementEntryDto = {
  id: string;
  snapshotId: string;
  participantId: string;
  netAmount: string | number;
  role: GroupExpenseSettlementRole;
  createdAt: string;
  participant: {
    id: string;
    displayName: string;
    userId: string | null;
    isOwner: boolean;
  };
};

export type GroupExpenseSettlementSnapshotDto = {
  id: string;
  sessionId: string;
  createdByUserId: string;
  label: string | null;
  snapshotAt: string;
  notes: string | null;
  createdAt: string;
  entries: GroupExpenseSettlementEntryDto[];
};

export type GroupExpenseBalanceSummaryDto = {
  participantId: string;
  displayName: string;
  isOwner: boolean;
  userId: string | null;
  grossPaid: number;
  grossConsumed: number;
  repaidOut: number;
  repaidIn: number;
  netBalance: number;
  role: GroupExpenseSettlementRole;
};

export type GroupExpenseTransferRecommendationDto = {
  fromParticipantId: string;
  fromDisplayName: string;
  toParticipantId: string;
  toDisplayName: string;
  amount: number;
};

export type GroupExpenseSessionSummaryDto = {
  totalExpenses: number;
  totalAssigned: number;
  totalRepayments: number;
  outstandingSplit: number;
  participantCount: number;
  activeItemCount: number;
  balances: GroupExpenseBalanceSummaryDto[];
  recommendedTransfers: GroupExpenseTransferRecommendationDto[];
};

export type GroupExpenseSessionDto = {
  id: string;
  ownerUserId: string;
  sessionCode: string;
  title: string;
  currency: string;
  status: GroupExpenseSessionStatus;
  notes: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  owner: GroupExpenseOwnerDto;
  participants: GroupExpenseParticipantDto[];
  items: GroupExpenseItemDto[];
  repayments: GroupExpenseRepaymentDto[];
  settlementSnapshots: GroupExpenseSettlementSnapshotDto[];
  summary: GroupExpenseSessionSummaryDto;
};

export type CreateGroupExpenseSessionRequest = {
  title: string;
  currency?: string;
  notes?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
};

export type JoinGroupExpenseSessionRequest = {
  sessionCode: string;
  displayName: string;
};

export type UpdateGroupExpenseSessionRequest = {
  title?: string;
  currency?: string;
  notes?: string | null;
  status?: GroupExpenseSessionStatus;
  startedAt?: string | null;
  endedAt?: string | null;
};

export type UpsertGroupExpenseParticipantRequest = {
  displayName: string;
};

export type GroupExpenseShareInputRequest = {
  participantId: string;
  amount: number;
  notes?: string | null;
};

export type UpsertGroupExpenseItemRequest = {
  title: string;
  locationLabel?: string | null;
  amount: number;
  currency?: string;
  incurredAt: string;
  notes?: string | null;
  paidByParticipantId: string;
  splitMode: GroupExpenseSplitMode;
  participantIds?: string[];
  shares?: GroupExpenseShareInputRequest[];
};

export type UpsertGroupExpenseRepaymentRequest = {
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
  currency?: string;
  paidAt: string;
  notes?: string | null;
};

export type FinalizeGroupExpenseSessionRequest = {
  label?: string | null;
  notes?: string | null;
  closeSession?: boolean;
};

export type FinalizeGroupExpenseSessionResponse = {
  snapshot: GroupExpenseSettlementSnapshotDto;
  summary: GroupExpenseSessionSummaryDto;
  sessionStatus: GroupExpenseSessionStatus;
};

const buildSessionDetailPath = (sessionCode: string) =>
  `${API_ENDPOINTS.GROUP_EXPENSE_SESSIONS}/${encodeURIComponent(sessionCode)}`;

export const groupExpenseService = {
  async listOwnedSessions() {
    return get<ApiResponse<GroupExpenseSessionDto[]>>(
      API_ENDPOINTS.GROUP_EXPENSE_SESSIONS,
    );
  },

  async createSession(body: CreateGroupExpenseSessionRequest) {
    return post<ApiResponse<GroupExpenseSessionDto>>(
      API_ENDPOINTS.GROUP_EXPENSE_SESSIONS,
      body,
    );
  },

  async getSessionByCode(sessionCode: string) {
    return get<ApiResponse<GroupExpenseSessionDto>>(
      buildSessionDetailPath(sessionCode),
    );
  },

  async joinSession(body: JoinGroupExpenseSessionRequest) {
    return post<ApiResponse<GroupExpenseSessionDto>>(
      API_ENDPOINTS.GROUP_EXPENSE_JOIN,
      body,
    );
  },

  async updateSession(
    sessionCode: string,
    body: UpdateGroupExpenseSessionRequest,
  ) {
    return patch<ApiResponse<GroupExpenseSessionDto>>(
      buildSessionDetailPath(sessionCode),
      body,
    );
  },

  async addParticipant(
    sessionCode: string,
    body: UpsertGroupExpenseParticipantRequest,
  ) {
    return post<ApiResponse<GroupExpenseSessionDto>>(
      `${buildSessionDetailPath(sessionCode)}/participants`,
      body,
    );
  },

  async removeParticipant(sessionCode: string, participantId: string) {
    return del<ApiResponse<GroupExpenseSessionDto>>(
      `${buildSessionDetailPath(sessionCode)}/participants/${participantId}`,
    );
  },

  async createItem(sessionCode: string, body: UpsertGroupExpenseItemRequest) {
    return post<ApiResponse<GroupExpenseSessionDto>>(
      `${buildSessionDetailPath(sessionCode)}/items`,
      body,
    );
  },

  async updateItem(
    sessionCode: string,
    itemId: string,
    body: Partial<UpsertGroupExpenseItemRequest>,
  ) {
    return put<ApiResponse<GroupExpenseSessionDto>>(
      `${buildSessionDetailPath(sessionCode)}/items/${itemId}`,
      body,
    );
  },

  async deleteItem(sessionCode: string, itemId: string) {
    return del<ApiResponse<GroupExpenseSessionDto>>(
      `${buildSessionDetailPath(sessionCode)}/items/${itemId}`,
    );
  },

  async createRepayment(
    sessionCode: string,
    body: UpsertGroupExpenseRepaymentRequest,
  ) {
    return post<ApiResponse<GroupExpenseSessionDto>>(
      `${buildSessionDetailPath(sessionCode)}/repayments`,
      body,
    );
  },

  async updateRepayment(
    sessionCode: string,
    repaymentId: string,
    body: Partial<UpsertGroupExpenseRepaymentRequest>,
  ) {
    return put<ApiResponse<GroupExpenseSessionDto>>(
      `${buildSessionDetailPath(sessionCode)}/repayments/${repaymentId}`,
      body,
    );
  },

  async deleteRepayment(sessionCode: string, repaymentId: string) {
    return del<ApiResponse<GroupExpenseSessionDto>>(
      `${buildSessionDetailPath(sessionCode)}/repayments/${repaymentId}`,
    );
  },

  async finalizeSession(
    sessionCode: string,
    body: FinalizeGroupExpenseSessionRequest,
  ) {
    return post<ApiResponse<FinalizeGroupExpenseSessionResponse>>(
      `${buildSessionDetailPath(sessionCode)}/finalize`,
      body,
    );
  },
};
