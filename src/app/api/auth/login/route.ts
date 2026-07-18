import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { AUTH_COOKIE_NAME, generateToken, getAuthCookieOptions } from '@/lib/auth';
import { enforceRateLimit } from '@/lib/rate-limit';
import { LoginRequest, AuthResponse, ErrorResponse } from '@/features/auth/types/auth';

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = enforceRateLimit(request, 'auth:login', 10, 15 * 60 * 1000);
    if (rateLimitResponse) return rateLimitResponse;

    const body: LoginRequest = await request.json();
    const email = body.email?.trim().toLowerCase();
    const { password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.userAccount.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          message: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    const response = NextResponse.json<AuthResponse>(
      {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
          },
        },
      },
      { status: 200 }
    );
    response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    return response;
  } catch (error) {
    console.error('Login error:', error);
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
