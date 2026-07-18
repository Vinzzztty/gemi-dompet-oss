import { NextRequest, NextResponse } from 'next/server';

import crypto from 'crypto';
import { Resend } from 'resend';
import { getPasswordResetEmailTemplate } from '@/lib/email-templates';
import { enforceRateLimit } from '@/lib/rate-limit';

import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const rateLimitResponse = enforceRateLimit(request, 'auth:forgot-password', 5, 60 * 60 * 1000);
        if (rateLimitResponse) return rateLimitResponse;

        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { success: false, message: 'Email harus diisi' },
                { status: 400 }
            );
        }

        // Find user by email
        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await prisma.userAccount.findUnique({
            where: { email: normalizedEmail },
        });

        const successResponse = NextResponse.json({
            success: true,
            message: 'Jika email terdaftar, tautan reset password akan dikirimkan.',
        });

        if (!user) {
            return successResponse;
        }

        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.error('RESEND_API_KEY is not configured');
            return NextResponse.json(
                { success: false, message: 'Layanan email belum dikonfigurasi.' },
                { status: 503 },
            );
        }

        const resend = new Resend(resendApiKey);

        // Generate secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        // Delete any existing unused tokens for this user
        await prisma.passwordResetToken.deleteMany({
            where: {
                userId: user.id,
                used: false,
            },
        });

        // Create new reset token
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: resetTokenHash,
                expiresAt,
            },
        });

        // Create reset link
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        // Send email using Resend
        try {
            const { error } = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
                to: normalizedEmail,
                subject: 'Reset Password - Gemi Dompet',
                html: getPasswordResetEmailTemplate(resetLink, user.fullName),
            });

            if (error) {
                console.error('Email sending returned error:', error);
                return NextResponse.json(
                    {
                        success: false,
                        message: 'Gagal mengirim email: ' + error.message
                    },
                    { status: 500 }
                );
            }
        } catch (emailError) {
            console.error('Email sending threw error:', emailError);
            return NextResponse.json(
                {
                    success: false,
                    message: 'Gagal mengirim email. Silakan coba lagi nanti.'
                },
                { status: 500 }
            );
        }

        return successResponse;

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { success: false, message: 'Terjadi kesalahan. Silakan coba lagi.' },
            { status: 500 }
        );
    }
}
