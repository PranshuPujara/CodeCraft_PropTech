import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getAuthUser } from '../../../../lib/auth-session';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const authUser = await getAuthUser();
    const currentUserId = authUser?.id || 'demo-user-1';

    const agreement = await db.agreement.findUnique({
      where: { id },
    });

    if (!agreement) {
      return NextResponse.json(
        { error: 'Agreement not found' },
        { status: 404 }
      );
    }

    if (agreement.userId !== currentUserId) {
      return NextResponse.json(
        { error: 'Unauthorized access to agreement' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: agreement.id,
      userId: agreement.userId,
      propertyId: agreement.propertyId,
      fileName: agreement.fileName,
      uploadedAt: agreement.uploadedAt,
      extractedFields: JSON.parse(agreement.extractedFields),
      summary: agreement.summary,
      flaggedClauses: JSON.parse(agreement.flaggedClauses),
    });
  } catch (error) {
    console.error('Error fetching agreement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agreement' },
      { status: 500 }
    );
  }
}
