import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const agreement = await db.agreement.findUnique({
      where: { id },
    });

    if (!agreement) {
      return NextResponse.json(
        { error: 'Agreement not found' },
        { status: 404 }
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
