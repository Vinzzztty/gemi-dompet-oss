import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/categories/[id] - Get single category
export async function GET(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;
      
      const category = await prisma.category.findFirst({
        where: { 
          id,
          userId: req.userId!,
        },
      });

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Kategori tidak ditemukan',
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: category,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error fetching category:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch category',
          message: 'Gagal mengambil data kategori',
        },
        { status: 500 }
      );
    }
  });
}

// PUT /api/categories/[id] - Update category
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const { name, icon } = body;

      // Check if category exists and belongs to user
      const existingCategory = await prisma.category.findFirst({
        where: { 
          id,
          userId: req.userId!,
        },
      });

      if (!existingCategory) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Kategori tidak ditemukan',
          },
          { status: 404 }
        );
      }

      // Update category
      const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
          ...(name && { name: name.trim() }),
          ...(icon && { icon }),
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: updatedCategory,
          message: 'Kategori berhasil diupdate',
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error updating category:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update category',
          message: 'Gagal mengupdate kategori',
        },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { id } = await params;

      // Check if category exists and belongs to user
      const category = await prisma.category.findFirst({
        where: { 
          id,
          userId: req.userId!,
        },
        include: {
          _count: {
            select: { 
              incomeTransactions: true,
              expenseTransactions: true,
            },
          },
        },
      });

      if (!category) {
        return NextResponse.json(
          {
            success: false,
            error: 'Not found',
            message: 'Kategori tidak ditemukan',
          },
          { status: 404 }
        );
      }

      // Check if category is used in transactions
      const totalTransactions = category._count.incomeTransactions + category._count.expenseTransactions;
      if (totalTransactions > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Category in use',
            message: `Kategori tidak dapat dihapus karena masih digunakan oleh ${totalTransactions} transaksi`,
          },
          { status: 400 }
        );
      }

      // Delete category
      await prisma.category.delete({
        where: { id },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Kategori berhasil dihapus',
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error deleting category:', error);
      
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete category',
          message: 'Gagal menghapus kategori',
        },
        { status: 500 }
      );
    }
  });
}
