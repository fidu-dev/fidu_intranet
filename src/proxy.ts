import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Protect all routes by default, except public ones if needed
// For this B2B app, almost everything should be protected.
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, request) => {
    // Basic check to avoid crashes during build if keys are missing
    if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
        return;
    }

    if (!isPublicRoute(request)) {
        await auth.protect();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
