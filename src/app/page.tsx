import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const user = await currentUser();

  if (!user) {
    // Middleware should handle this, but safety first
    redirect('/sign-in');
  }

  const role = user.publicMetadata?.role;

  if (role === 'admin' || user.emailAddresses[0]?.emailAddress === 'admin@fidu.com') {
    redirect('/admin');
  }

  // Default to portal for partner agencies and sales
  redirect('/portal');
}
