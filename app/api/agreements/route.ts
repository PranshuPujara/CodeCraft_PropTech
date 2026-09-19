import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { getAuthUser } from '../../../lib/auth-session';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
import { extractTextFromPDF } from '../../../lib/agreementPdf';
import { completeStructuredJSON } from '../../../lib/ai/client';
import { AGREEMENT_EXTRACTION_SYSTEM_PROMPT } from '../../../lib/ai/prompts/agreementExtract';
import { AGREEMENT_FLAGS_SYSTEM_PROMPT } from '../../../lib/ai/prompts/agreementFlags';
import {
  AgreementExtractionResponse,
  AgreementFlagsResponse,
  LEGAL_GUARDRAIL_DISCLAIMER,
} from '../../../lib/ai/types';

const ExtractedFieldSchema = z.object({
  value: z.union([z.string(), z.number()]).nullable().optional().default(null),
  found: z.boolean().optional().default(false),
  clauseSnippet: z.string().nullable().optional().default(null),
});

const defaultField = { value: null, found: false, clauseSnippet: null };

const AgreementExtractionSchema = z.object({
  rent: ExtractedFieldSchema.default(defaultField),
  deposit: ExtractedFieldSchema.default(defaultField),
  leaseDuration: ExtractedFieldSchema.default(defaultField),
  lockInPeriod: ExtractedFieldSchema.default(defaultField),
  noticePeriod: ExtractedFieldSchema.default(defaultField),
  rentEscalation: ExtractedFieldSchema.default(defaultField),
  maintenanceResponsibility: ExtractedFieldSchema.default(defaultField),
  utilityResponsibility: ExtractedFieldSchema.default(defaultField),
  penalties: ExtractedFieldSchema.default(defaultField),
  terminationConditions: ExtractedFieldSchema.default(defaultField),
  summary: z.string().optional().default('Summary of agreement terms extracted from document.'),
});

const FlaggedClauseItemSchema = z.object({
  clause: z.string().default('Clause worth noting'),
  reason: z.string().default('Clause worth reviewing with landlord'),
  attentionLevel: z.string().transform((val) => {
    const v = val.toLowerCase();
    if (v === 'high' || v === 'critical' || v === 'urgent') return 'high';
    if (v === 'low' || v === 'info') return 'low';
    return 'medium';
  }),
});

const AgreementFlagsSchema = z.object({
  flaggedClauses: z.array(FlaggedClauseItemSchema).default([]),
  disclaimer: z.string().optional().default(LEGAL_GUARDRAIL_DISCLAIMER),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    const authUser = await getAuthUser();
    const userId = authUser?.id || 'demo-user-1';

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded. Please upload a rental agreement PDF.' },
        { status: 400 }
      );
    }

    // Input validation: file name & extension
    const fileName = file.name || 'agreement.pdf';
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Invalid file format. Only PDF files (.pdf) are accepted.' },
        { status: 400 }
      );
    }

    // Input validation: file type & size (max 5MB, min 1 byte)
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Invalid file format. Only PDF is allowed.' },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit
    if (file.size <= 0) {
      return NextResponse.json(
        { error: 'The uploaded file is empty. Please upload a valid PDF.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum allowed limit (5MB).' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        { error: 'Unable to read file content. Please try again.' },
        { status: 400 }
      );
    }

    // 1. Extract text from PDF
    const extractedText = await extractTextFromPDF(buffer);

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract readable text from the uploaded PDF. Please ensure the document is not an image-only scan.' },
        { status: 400 }
      );
    }

    // 2. Generate structured fields
    const extractionResponse = await completeStructuredJSON<AgreementExtractionResponse>({
      systemPrompt: AGREEMENT_EXTRACTION_SYSTEM_PROMPT,
      userMessage: `Please extract the required fields from this rental agreement text:\n\n${extractedText}`,
      maxTokens: 2500,
    });

    // 3. Generate summary/flags
    const flagsResponse = await completeStructuredJSON<AgreementFlagsResponse>({
      systemPrompt: AGREEMENT_FLAGS_SYSTEM_PROMPT,
      userMessage: `Please analyze this rental agreement text and flag clauses that deserve attention:\n\n${extractedText}`,
      maxTokens: 1500,
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
        fileName,
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
    const authUser = await getAuthUser();
    const userId = authUser?.id || 'demo-user-1';

    const agreements = await db.agreement.findMany({
      where: { userId },
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
