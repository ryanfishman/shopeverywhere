import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const verification = await prisma.emailverificationtoken.findUnique({ where: { token } });

    if (!verification || verification.expires < new Date()) {
      if (verification) {
        await prisma.emailverificationtoken.delete({ where: { token } });
      }
      return NextResponse.json({ error: "Token invalid or expired" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: new Date() },
    });

    await prisma.emailverificationtoken.delete({ where: { token } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}










