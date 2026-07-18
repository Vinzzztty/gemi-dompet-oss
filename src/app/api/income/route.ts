import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';
import { CategoryType } from '@prisma/client';

// GET /api/income - List income transactions
export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      const skip = (page - 1) * limit;

      // Build date filter
      const dateFilter: any = {};
      if (startDate) {
        dateFilter.gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate);
      }

      const where: any = {
        userId: req.userId!,
      };

      if (Object.keys(dateFilter).length > 0) {
        where.tanggal = dateFilter;
      }

      // Get total count for pagination
      const total = await prisma.incomeTransaction.count({ where });

      // Fetch income transactions
      const incomeTransactions = await prisma.incomeTransaction.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,  // Added for consistency with expense
              type: true,  // Added for consistency with expense
            },
          },
          wallet: {
            select: {
              id: true,
              namaDompet: true,
              norek: true,
            },
          },
        },
        orderBy: {
          tanggal: 'desc',
        },
        skip,
        take: limit,
      });

      return NextResponse.json(
        {
          success: true,
          data: incomeTransactions,
          meta: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error('Error fetching income transactions:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch income transactions',
          message: 'Gagal mengambil data pemasukan',
        },
        { status: 500 }
      );
    }
  });
}

// POST /api/income - Create income transaction
export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { nama, nominal, categoryId, tanggal, catatan, walletId } = body;

      // Validation
      if (!nama || nama.trim() === '') {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Nama transaksi harus diisi',
          },
          { status: 400 }
        );
      }
      if (!nominal || nominal <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Nominal harus diisi dan lebih besar dari 0',
          },
          { status: 400 }
        );
      }

      if (!categoryId) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Kategori harus dipilih',
          },
          { status: 400 }
        );
      }

      if (!tanggal) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Tanggal harus diisi',
          },
          { status: 400 }
        );
      }

      // Validate category exists and is INCOME type
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Kategori tidak ditemukan',
          },
          { status: 400 }
        );
      }

      if (category.type !== CategoryType.INCOME) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Kategori harus bertipe INCOME',
          },
          { status: 400 }
        );
      }

      // Validate and parse date
      const parsedDate = new Date(tanggal);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Format tanggal tidak valid',
          },
          { status: 400 }
        );
      }

      // Validate catatan length if provided
      if (catatan && catatan.length > 500) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Catatan maksimal 500 karakter',
          },
          { status: 400 }
        );
      }

      // If no wallet is specified, automatically assign to "Others" wallet
      let finalWalletId = walletId;
      if (!finalWalletId) {
        // Find or create "Others" wallet for this user
        let othersWallet = await prisma.wallet.findFirst({
          where: {
            userId: req.userId!,
            namaDompet: 'Others'
          }
        });

        if (!othersWallet) {
          // Create "Others" wallet if it doesn't exist
          othersWallet = await prisma.wallet.create({
            data: {
              userId: req.userId!,
              namaDompet: 'Others',
              norek: null
            }
          });
        }

        finalWalletId = othersWallet.id;
      }

      // Create income transaction
      const incomeTransaction = await prisma.incomeTransaction.create({
        data: {
          userId: req.userId!,
          nama: nama.trim(),
          nominal,
          categoryId,
          tanggal: parsedDate,
          catatan: catatan?.trim() || null,
          walletId: finalWalletId,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              icon: true,  // Added for consistency with expense
              type: true,  // Added for consistency with expense
            },
          },
          wallet: {
            select: {
              id: true,
              namaDompet: true,
              norek: true,
            },
          },
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: incomeTransaction,
          message: 'Pemasukan berhasil ditambahkan',
        },
        { status: 201 }
      );
    } catch (error: any) {
      console.error('Error creating income transaction:', error);

      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create income transaction',
          message: 'Gagal menambahkan pemasukan',
        },
        { status: 500 }
      );
    }
  });
}
