import { NextRequest, NextResponse } from "next/server";
import { secureDb } from "@/lib/database-secure";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { providerFormDataSchema, validateRequest } from "@/lib/validation-schemas";
import { sendVerificationForProvider } from "@/lib/email-verification";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    console.log('Registration request received with content-type:', contentType);

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const formData = {
        email: String(form.get('email') || ''),
        firstName: String(form.get('firstName') || ''),
        lastName: String(form.get('lastName') || ''),
        phone: String(form.get('phone') || ''),
        companyName: String(form.get('institution') || ''),
        address: String(form.get('address') || 'Not provided'),
        description: String(form.get('description') || 'Provider registration pending details'),
        website: String(form.get('website') || '')
      };

      const validation = validateRequest(providerFormDataSchema, formData);
      if (!validation.success) {
        console.error('Validation errors:', validation.errors);
        return NextResponse.json(
          { error: 'Invalid form data', details: validation.errors },
          { status: 400 }
        );
      }

      const { email, firstName, lastName, phone, companyName, address } = validation.data;
      let user = await secureDb.db
        .select({ id: schema.users.id, role: schema.users.role, isActive: schema.users.isActive })
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1);

      let userId = user?.id || (await import('crypto')).randomUUID();
      if (!user) {
        await secureDb.db
          .insert(schema.users)
          .values({
            id: userId,
            email,
            password: 'stackauth',
            firstName,
            lastName,
            role: 'provider',
            phone: phone || null,
            emailVerified: false,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }

      const providerId = (await import('crypto')).randomUUID();
      await secureDb.db
        .insert(schema.providers)
        .values({
          id: providerId,
          userId,
          businessName: companyName,
          contactPerson: `${firstName} ${lastName}`,
          contactEmail: email,
          contactPhone: phone || 'Not provided',
          address: address || 'Not provided',
          registrationStatus: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        });

      await sendVerificationForProvider({ email, firstName, lastName, userId, providerId });
      return NextResponse.json({ success: true, providerId }, { status: 201 });
    }

    return NextResponse.json({ error: 'Unsupported content type' }, { status: 415 });
  } catch (error) {
    let errorMessage = 'An unexpected error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: "Registration failed", details: errorMessage }, { status: 500 });
  }
}
