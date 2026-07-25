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

/** Translates a Firebase callable error code into an actionable message. */
function friendlyFunctionsError(error: unknown): string {
  const code = String(
    (error as { code?: string })?.code ?? "",
  ).toLowerCase();
  const message =
    error instanceof Error ? error.message : "Screenshot import failed.";

  if (code.includes("unauthenticated")) {
    return "Your session expired — sign out and back in, then try again.";
  }
  if (code.includes("invalid-argument")) {
    return "That file couldn't be read as an image. Try a PNG or JPEG screenshot.";
  }
  if (code.includes("failed-precondition")) {
    // The function reached Claude but couldn't extract — pass its message through.
    return message;
  }
  if (
    code.includes("not-found") ||
    code.includes("internal") ||
    code.includes("unavailable")
  ) {
    return (
      "The screenshot extraction service isn't reachable. It runs in a Firebase " +
      "Cloud Function, which needs the Blaze plan, the function deployed " +
      "(firebase deploy --only functions), and the ANTHROPIC_API_KEY secret set " +
      "(firebase functions:secrets:set ANTHROPIC_API_KEY). See the README."
    );
  }
  return message;
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

  let extraction: ScreenshotExtraction | undefined;
  try {
    const result = await callable({
      image,
      mediaType: file.type || "image/png",
    });
    extraction = result.data?.extraction;
  } catch (error) {
    throw new Error(friendlyFunctionsError(error));
  }

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
