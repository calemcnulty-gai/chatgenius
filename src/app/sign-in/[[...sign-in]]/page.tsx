import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "bg-gray-900 shadow-xl",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-400",
            formButtonPrimary: "bg-indigo-600 hover:bg-indigo-500",
            formFieldInput: "bg-gray-800 text-white border-gray-700",
            formFieldLabel: "text-gray-300",
            footerActionLink: "text-indigo-400 hover:text-indigo-300",
            identityPreviewText: "text-white",
            formResendCodeLink: "text-indigo-400 hover:text-indigo-300",
          },
        }}
      />
    </div>
  );
} 