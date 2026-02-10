import { SignUp } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
                <h1 className="mb-6 text-2xl font-semibold text-gray-900">Join Fidu Viagens</h1>
                <SignUp />
            </div>
        </div>
    );
}
