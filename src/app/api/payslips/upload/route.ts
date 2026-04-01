import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { auth } from "@/auth"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth()
        if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
          throw new Error("Unauthorized")
        }

        return {
          allowedContentTypes: ["application/pdf"],
          tokenPayload: JSON.stringify({}),
        }
      },
      onUploadCompleted: async () => {
        // Nothing to do here — processing happens in the /api/payslips/bulk route
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
