import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { sendEmail } from "@/lib/email";
import { buildPasswordChangedEmail } from "@/lib/emailTemplates";

export async function POST(req: Request) {
  try {
    const { token, code, password } = await req.json();

    if (!token || !code || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const resetRecord = await prisma.passwordresettoken.findUnique({ where: { token } });

    if (!resetRecord || resetRecord.code !== code || resetRecord.expires < new Date()) {
      if (resetRecord) {
        await prisma.passwordresettoken.delete({ where: { token } });
      }
      return NextResponse.json({ error: "Invalid or expired reset request" }, { status: 400 });
    }

    const newPassword = await hash(password, 12);

    const user = await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: newPassword },
    });

    await prisma.passwordresettoken.deleteMany({ where: { userId: resetRecord.userId } });

    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: "Your ShopEverywhere password was changed",
        html: buildPasswordChangedEmail({ firstName: user.firstName || user.name || "there" }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}








