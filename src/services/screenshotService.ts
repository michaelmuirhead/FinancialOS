import { httpsCallable } from "firebase/functions";
import { ScreenshotExtraction } from "@/lib/screenshot";
import { functions, isDemoMode } from "./firebase";

/** Screenshot extraction runs in a Firebase Cloud Function. */
export function isScreenshotImportAvailable(): boolean {
  return !isDemoMode && functions != null;
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
  if (!functions) {
    throw new Error(
      "Screenshot import requires Firebase — see the setup notes in the README.",
    );
  }
  const image = await fileToBase64(file);
  const callable = httpsCallable<
    { image: string; mediaType: string },
    { extraction: ScreenshotExtraction }
  >(functions, "extractScreenshot");
  const result = await callable({
    image,
    mediaType: file.type || "image/png",
  });
  const extraction = result.data?.extraction;
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
