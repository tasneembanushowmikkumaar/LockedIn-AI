"use client";

import { ReactNode, useEffect } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function StoreUserWrapper({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const storeUser = useMutation(api.users.storeUser);

  useEffect(() => {
    if (isAuthenticated) {
      storeUser().catch(console.error);
    }
  }, [isAuthenticated, storeUser]);

  return <>{children}</>;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#dc2626",
          colorBackground: "#0a0a0a",
          colorInputBackground: "#171717",
          colorInputText: "#fafafa",
          colorText: "#fafafa",
          colorTextSecondary: "#a1a1aa",
          borderRadius: "0.75rem",
        },
        elements: {
          formButtonPrimary:
            "bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider",
          card: "bg-neutral-950 border border-neutral-800 shadow-2xl",
          headerTitle: "text-white font-bold",
          headerSubtitle: "text-neutral-400",
          socialButtonsBlockButton:
            "border-neutral-700 text-neutral-300 hover:bg-neutral-800",
          formFieldInput:
            "bg-neutral-900 border-neutral-700 text-white",
          footerActionLink: "text-red-500 hover:text-red-400",
        },
        layout: {
          socialButtonsPlacement: "bottom",
        },
      }}
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <StoreUserWrapper>
          {children}
        </StoreUserWrapper>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
