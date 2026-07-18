import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { enforceRateLimit } from '@/lib/rate-limit';
import { RegisterRequest, AuthResponse, ErrorResponse } from '@/features/auth/types/auth';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, 'auth:register', 5, 60 * 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const body: RegisterRequest = await request.json();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const fullName = body.fullName?.trim();

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: 'Email, password, and full name are required',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 12) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: 'Password must be at least 12 characters long',
        },
        { status: 422 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.userAccount.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: 'Email already registered',
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and default "Others" wallet in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.userAccount.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
        },
      });

      // Create default "Others" wallet for the new user
      await tx.wallet.create({
        data: {
          userId: user.id,
          namaDompet: 'Others',
          norek: null,
        },
      });

      return user;
    });

    // Return success response
    return NextResponse.json<AuthResponse>(
      {
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: result.id,
            email: result.email,
            fullName: result.fullName,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
