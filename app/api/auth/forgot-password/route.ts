import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNumericCode, generateToken, getAppUrl } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { buildResetEmail } from "@/lib/emailTemplates";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const token = generateToken();
      const code = generateNumericCode();

      await prisma.passwordresettoken.deleteMany({ where: { userId: user.id } });
      await prisma.passwordresettoken.create({
        data: {
          userId: user.id,
          token,
          code,
          expires: new Date(Date.now() + 1000 * 60 * 30),
        },
      });

      const resetUrl = `${getAppUrl()}/auth/reset-password?token=${token}&code=${code}`;

      await sendEmail({
        to: normalizedEmail,
        subject: "Reset your ShopEverywhere password",
        html: buildResetEmail({
          firstName: user.firstName || user.name || "there",
          url: resetUrl,
          code,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}







