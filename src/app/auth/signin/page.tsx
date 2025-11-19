
import { SignInForm } from "@/components/auth/sign-in-form";
import Image from "next/image";
import Link from "next/link";
import { FirebaseClientProvider } from "@/firebase/client-provider";

export default function SignInPage() {
  return (
    <FirebaseClientProvider>
      <div className="flex max-h-screen w-full">
        <div className="hidden md:block md:w-1/2 lg:w-2/5 h-screen relative">
          <Image
            src="https://picsum.photos/seed/3/1920/1080"
            alt="Sign In Image"
            layout="fill"
            objectFit="cover"
            className="fixed top-0 left-0 w-1/2 lg:w-2/5 h-screen"
            data-ai-hint="medical background"
          />
        </div>
        <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col justify-center items-center p-6 overflow-y-auto">
          <div className="py-5">
            <Link href="/" className="text-5xl flex flex-col items-center font-bold text-black">
              <Image src="/lab-link-logo.jpg" alt="Lab Link Logo" width={150} height={150} className="h-[150px] w-[150px] " />
              <span>Lab Link</span>
            </Link>
          </div>
          <SignInForm />
        </div>
      </div>
    </FirebaseClientProvider>
  );
}
