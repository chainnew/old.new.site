import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import Replicate from "replicate";

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Try Cloudflare context first, then fall back to process.env
    let apiToken: string | undefined;
    try {
      const { env } = await getCloudflareContext();
      apiToken = (env as Record<string, string>).REPLICATE_API_TOKEN;
    } catch {
      apiToken = process.env.REPLICATE_API_TOKEN;
    }

    if (!apiToken) {
      return NextResponse.json(
        { error: "REPLICATE_API_TOKEN not configured" },
        { status: 500 }
      );
    }

    const replicate = new Replicate({ auth: apiToken });

    // Use CodeFormer - best balance of quality and natural look
    const prediction = await replicate.predictions.create({
      version: "7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142edd9d2cd56",
      input: {
        image: image,
        upscale: 2,
        face_upsample: true,
        background_enhance: true,
        codeformer_fidelity: 0.7,  // 0-1, higher = more faithful to original
      },
    });

    // Wait for the prediction to complete
    let result = await replicate.predictions.get(prediction.id);
    while (result.status !== "succeeded" && result.status !== "failed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      result = await replicate.predictions.get(prediction.id);
    }

    if (result.status === "failed") {
      const errorMsg = typeof result.error === "string" ? result.error : "Enhancement failed";
      throw new Error(errorMsg);
    }

    console.log("Replicate result:", result.output);

    // The output should be a URL string
    const enhancedUrl = result.output as string;
    if (!enhancedUrl || typeof enhancedUrl !== "string") {
      throw new Error("Invalid output from Replicate");
    }

    return NextResponse.json({ enhancedUrl });
  } catch (error) {
    console.error("Enhancement error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Enhancement failed" },
      { status: 500 }
    );
  }
}
