import { RouterProvider } from "react-router-dom";
import { AuthGate } from "@/components/auth/AuthGate";
import { Providers } from "./providers";
import { router } from "./router";

export function App() {
  return (
    <Providers>
      <AuthGate>
        <RouterProvider router={router} />
      </AuthGate>
    </Providers>
  );
}
