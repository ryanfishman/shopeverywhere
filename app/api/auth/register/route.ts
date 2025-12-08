import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { generateToken, getAppUrl } from "@/lib/tokens";
import { sendEmail } from "@/lib/email";
import { buildVerificationEmail } from "@/lib/emailTemplates";

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password, cartId } = await req.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const normalizedEmail = String(email).toLowerCase();

    const exists = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (exists) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);

    const cartForCopy = cartId
      ? await prisma.shoppingcart.findFirst({
          where: {
            id: cartId,
            status: "shopping",
          },
        })
      : null;

    const user = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName} ${lastName}`.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        country: cartForCopy?.country,
        state: cartForCopy?.state,
        city: cartForCopy?.city,
        address: cartForCopy?.address,
        postalCode: cartForCopy?.postalCode,
        latitude: cartForCopy?.latitude,
        longitude: cartForCopy?.longitude,
        zoneId: cartForCopy?.zoneId,
      },
    });

    if (cartForCopy) {
      await prisma.shoppingcart.update({
        where: { id: cartForCopy.id },
        data: { userId: user.id },
      });
    }

    const token = generateToken();

    await prisma.emailverificationtoken.deleteMany({ where: { userId: user.id } });
    await prisma.emailverificationtoken.create({
      data: {
        userId: user.id,
        token,
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
      },
    });

    const verificationUrl = `${getAppUrl()}/auth/verify?token=${token}`;

    await sendEmail({
      to: normalizedEmail,
      subject: "Confirm your ShopEverywhere email",
      html: buildVerificationEmail({ firstName: firstName.trim(), url: verificationUrl }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}



