import { NextRequest, NextResponse } from 'next/server';

import crypto from 'crypto';

import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { enforceRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
    try {
        const rateLimitResponse = enforceRateLimit(request, 'auth:reset-password', 10, 60 * 60 * 1000);
        if (rateLimitResponse) return rateLimitResponse;

        const { token, newPassword } = await request.json();

        if (!token || !newPassword) {
            return NextResponse.json(
                { success: false, message: 'Token dan password baru harus diisi' },
                { status: 400 }
            );
        }

        // Validate password length
        if (newPassword.length < 12) {
            return NextResponse.json(
                { success: false, message: 'Password minimal 12 karakter' },
                { status: 400 }
            );
        }

        // Find the reset token
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: {
                token: crypto.createHash('sha256').update(String(token)).digest('hex'),
            },
            include: { user: true },
        });

        if (!resetToken) {
            return NextResponse.json(
                { success: false, message: 'Token tidak valid' },
                { status: 400 }
            );
        }

        // Check if token is already used
        if (resetToken.used) {
            return NextResponse.json(
                { success: false, message: 'Token sudah digunakan' },
                { status: 400 }
            );
        }

        // Check if token is expired
        if (new Date() > resetToken.expiresAt) {
            return NextResponse.json(
                { success: false, message: 'Token sudah kadaluarsa. Silakan request ulang.' },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await hashPassword(newPassword);

        // Update user password and mark token as used
        await prisma.$transaction([
            prisma.userAccount.update({
                where: { id: resetToken.userId },
                data: { password: hashedPassword },
            }),
            prisma.passwordResetToken.update({
                where: { id: resetToken.id },
                data: { used: true },
            }),
        ]);

        return NextResponse.json({
            success: true,
            message: 'Password berhasil direset. Silakan login dengan password baru.',
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { success: false, message: 'Terjadi kesalahan. Silakan coba lagi.' },
            { status: 500 }
        );
    }
}
