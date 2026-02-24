import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/cadastro(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
        try {
            const { userId } = await auth();
            if (!userId) {
                const signInUrl = new URL('/sign-in', req.url);
                return NextResponse.redirect(signInUrl);
            }
        } catch (error) {
            console.error('Middleware internal Clerk Error:', error);
            const signInUrl = new URL('/sign-in', req.url);
            return NextResponse.redirect(signInUrl);
        }
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
