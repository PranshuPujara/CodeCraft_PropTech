import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
import { extractTextFromPDF } from '../../../lib/agreementPdf';
import { completeStructuredJSON } from '../../../lib/ai/client';
import { AGREEMENT_EXTRACTION_SYSTEM_PROMPT } from '../../../lib/ai/prompts/agreementExtract';
import { AGREEMENT_FLAGS_SYSTEM_PROMPT } from '../../../lib/ai/prompts/agreementFlags';

const ExtractedFieldSchema = z.object({
  value: z.union([z.string(), z.number()]).nullable(),
  found: z.boolean(),
  clauseSnippet: z.string().nullable().optional(),
});

const AgreementExtractionSchema = z.object({
  rent: ExtractedFieldSchema,
  deposit: ExtractedFieldSchema,
  leaseDuration: ExtractedFieldSchema,
  lockInPeriod: ExtractedFieldSchema,
  noticePeriod: ExtractedFieldSchema,
  rentEscalation: ExtractedFieldSchema,
  maintenanceResponsibility: ExtractedFieldSchema,
  utilityResponsibility: ExtractedFieldSchema,
  penalties: ExtractedFieldSchema,
  terminationConditions: ExtractedFieldSchema,
  summary: z.string(),
});

const FlaggedClauseItemSchema = z.object({
  clause: z.string(),
  reason: z.string(),
  attentionLevel: z.enum(['high', 'medium', 'low']),
});

const AgreementFlagsSchema = z.object({
  flaggedClauses: z.array(FlaggedClauseItemSchema),
  disclaimer: z.string(),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    // For demo purposes, we'll hardcode the user ID to the demo user 
    // since authentication isn't implemented in this track.
    const userId = 'demo-user-1';

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // 1. File Validation
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file format. Only PDF is allowed.' },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds the 5MB limit.' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Extract text from PDF
    const extractedText = await extractTextFromPDF(buffer);

    // 3. Generate structured fields
    const extractionResponse = await completeStructuredJSON<any>({
      systemPrompt: AGREEMENT_EXTRACTION_SYSTEM_PROMPT,
      userMessage: `Please extract the required fields from this rental agreement text:\n\n${extractedText}`,
    });

    // 4. Generate summary/flags
    const flagsResponse = await completeStructuredJSON<any>({
      systemPrompt: AGREEMENT_FLAGS_SYSTEM_PROMPT,
      userMessage: `Please analyze this rental agreement text and flag clauses that deserve attention:\n\n${extractedText}`,
    });

    // 5. Runtime Validation
    let validatedExtraction;
    let validatedFlags;
    try {
      validatedExtraction = AgreementExtractionSchema.parse(extractionResponse);
      validatedFlags = AgreementFlagsSchema.parse(flagsResponse);
    } catch (zodError: any) {
      console.error('Schema validation failed:', zodError);
      return NextResponse.json(
        { error: 'AI generated an invalid response shape.' },
        { status: 502 }
      );
    }

    // 6. Store the result
    const agreement = await db.agreement.create({
      data: {
        userId,
        fileName: file.name,
        extractedFields: JSON.stringify({
          rent: validatedExtraction.rent,
          deposit: validatedExtraction.deposit,
          leaseDuration: validatedExtraction.leaseDuration,
          lockInPeriod: validatedExtraction.lockInPeriod,
          noticePeriod: validatedExtraction.noticePeriod,
          rentEscalation: validatedExtraction.rentEscalation,
          maintenanceResponsibility: validatedExtraction.maintenanceResponsibility,
          utilityResponsibility: validatedExtraction.utilityResponsibility,
          penalties: validatedExtraction.penalties,
          terminationConditions: validatedExtraction.terminationConditions,
        }),
        summary: validatedExtraction.summary,
        flaggedClauses: JSON.stringify(validatedFlags.flaggedClauses),
      },
    });

    return NextResponse.json(agreement);
  } catch (error) {
    console.error('Error analyzing agreement:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const agreements = await db.agreement.findMany({
      where: { userId: 'demo-user-1' },
      orderBy: { uploadedAt: 'desc' },
    });

    const parsed = agreements.map((a) => {
      let extractedFields = {};
      let flaggedClauses = [];
      try {
        extractedFields = JSON.parse(a.extractedFields);
      } catch {
        extractedFields = {};
      }
      try {
        flaggedClauses = JSON.parse(a.flaggedClauses);
      } catch {
        flaggedClauses = [];
      }

      return {
        id: a.id,
        fileName: a.fileName,
        uploadedAt: a.uploadedAt,
        propertyId: a.propertyId,
        summary: a.summary,
        extractedFields,
        flaggedClauses,
      };
    });

    return NextResponse.json({ agreements: parsed, count: parsed.length });
  } catch (error) {
    console.error('Error fetching agreements:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: 'Failed to fetch agreements', details: message },
      { status: 500 }
    );
  }
}
