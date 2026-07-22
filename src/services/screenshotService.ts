import { ScreenshotExtraction } from "@/lib/screenshot";
import { isDemoMode, supabase } from "./supabase";

/** Screenshot extraction needs the Edge Function, which needs Supabase. */
export function isScreenshotImportAvailable(): boolean {
  return !isDemoMode && supabase != null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function extractFromScreenshot(
  file: File,
): Promise<ScreenshotExtraction> {
  if (!supabase) {
    throw new Error(
      "Screenshot import requires Supabase — see the setup notes in the README.",
    );
  }
  const image = await fileToBase64(file);
  const { data, error } = await supabase.functions.invoke(
    "extract-screenshot",
    {
      body: { image, mediaType: file.type || "image/png" },
    },
  );
  if (error) {
    throw new Error(error.message ?? "Extraction failed");
  }
  if (data?.error) {
    throw new Error(String(data.error));
  }
  const extraction = data?.extraction as ScreenshotExtraction | undefined;
  if (!extraction) {
    throw new Error("The extraction service returned an empty result.");
  }
  return {
    balances: extraction.balances ?? [],
    bills: extraction.bills ?? [],
    transactions: extraction.transactions ?? [],
    sourceDescription: extraction.sourceDescription,
  };
}
