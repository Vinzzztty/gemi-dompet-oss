import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CategoryType } from '@prisma/client';
import { withAuth, AuthenticatedRequest } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { searchParams } = new URL(req.url);
      const type = searchParams.get('type');

      const where: any = {
        userId: req.userId!,
      };

      if (type) {
        where.type = type.toUpperCase() as CategoryType;
      }

      const categories = await prisma.category.findMany({
        where,
        orderBy: { name: 'asc' },
      });

      return NextResponse.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch categories',
          message: 'Gagal mengambil data kategori',
        },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const body = await req.json();
      const { name, type, icon } = body;

      // Validation
      if (!name || !name.trim()) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Nama kategori harus diisi',
          },
          { status: 400 }
        );
      }

      if (!type || !['INCOME', 'EXPENSE'].includes(type)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Tipe kategori harus INCOME atau EXPENSE',
          },
          { status: 400 }
        );
      }

      // Check if category with same name and type already exists for this user
      const existingCategory = await prisma.category.findFirst({
        where: {
          userId: req.userId!,
          name: name.trim(),
          type: type as CategoryType,
        },
      });

      if (existingCategory) {
        return NextResponse.json(
          {
            success: false,
            error: 'Duplicate category',
            message: 'Kategori dengan nama dan tipe yang sama sudah ada',
          },
          { status: 400 }
        );
      }

      // Create category
      const category = await prisma.category.create({
        data: {
          userId: req.userId!,
          name: name.trim(),
          type: type as CategoryType,
          icon: icon || 'wallet', // Default to wallet if not provided
        },
      });

      return NextResponse.json(
        {
          success: true,
          data: category,
          message: 'Kategori berhasil ditambahkan',
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating category:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create category',
          message: 'Gagal menambahkan kategori',
        },
        { status: 500 }
      );
    }
  });
}
