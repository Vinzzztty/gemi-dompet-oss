import { BaseService } from '@/services/base.service';
import { API_ENDPOINTS } from '@/lib/constants';

export interface CreateTransferRequest {
    fromWalletId: string;
    toWalletId: string;
    amount: number;
    date: string;
    note?: string;
}

export class TransferService extends BaseService<any, CreateTransferRequest> {
    constructor() {
        super(API_ENDPOINTS.TRANSFER);
    }

    // Override create if needed, or rely on BaseService.create
    // BaseService.create likely does post('/', data)
}

export const transferService = new TransferService();
