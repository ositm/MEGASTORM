import Link from "next/link";
import { Button } from "../ui/button";

export default function CallToAction() {
    return (
        <section className="py-20 bg-[#001C3D] text-white">
            <div className="container px-4 mx-auto">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="mb-4 text-3xl font-bold">Ready to Take the Next Step in Your Health Journey?</h2>
                    <p className="mb-8 text-blue-100">Book a test with our certified lab professionals and get accurate results you can trust.</p>
                    <Button asChild size="lg">
                        <Link href="/auth/signin">Book a Lab Test</Link>
                    </Button>
                </div>
            </div>
      </section>
    )
}