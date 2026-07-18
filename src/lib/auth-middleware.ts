import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifyToken } from '@/lib/auth';

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  user?: {
    id: string;
    email: string;
  };
}

export async function withAuth(
  request: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Sesi tidak ditemukan. Silakan login kembali.',
        },
        { status: 401 }
      );
    }

    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      const origin = request.headers.get('origin');
      if (origin && origin !== request.nextUrl.origin) {
        return NextResponse.json(
          {
            success: false,
            error: 'Forbidden',
            message: 'Origin request tidak diizinkan.',
          },
          { status: 403 },
        );
      }
    }

    const decoded = verifyToken(token);

    // Attach user info to request
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.userId = decoded.userId;
    authenticatedRequest.user = {
      id: decoded.userId,
      email: decoded.email,
    };

    // Call the handler with authenticated request
    return await handler(authenticatedRequest);
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid token',
          message: 'Token tidak valid',
        },
        { status: 401 }
      );
    }

    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Token expired',
          message: 'Token sudah kadaluarsa, silakan login kembali',
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Authentication failed',
        message: 'Autentikasi gagal',
      },
      { status: 401 }
    );
  }
}
