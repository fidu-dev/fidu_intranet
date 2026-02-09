import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getAgencyByEmail } from '@/lib/airtable/service';

export default async function Home() {
  const user = await currentUser();

  if (!user) {
    // Middleware should handle this, but safety first
    redirect('/sign-in');
  }

  const email = user.emailAddresses[0]?.emailAddress;
  const role = user.publicMetadata?.role;

  // Admin logic
  if (role === 'admin' || email === 'admin@fidu.com' || email === 'rafael@fidu.com') {
    redirect('/admin');
  }

  // Whitelist Check: Must be in Airtable Agentes table
  if (email) {
    const agency = await getAgencyByEmail(email);
    console.log(`[AUTH_ROOT] Result for ${email}: ${agency ? 'FOUND' : 'NOT FOUND'}`);
    if (!agency) {
      console.log(`[AUTH_ROOT] Redirecting to unauthorized (no agency found)`);
      redirect('/unauthorized');
    }
  } else {
    console.log(`[AUTH_ROOT] Redirecting to unauthorized (no email found)`);
    redirect('/unauthorized');
  }

  // Default to portal for partner agencies and sales
  console.log(`[AUTH_ROOT] Success! Redirecting to /portal`);
  redirect('/portal');
}
