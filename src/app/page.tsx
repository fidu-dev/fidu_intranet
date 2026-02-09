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
    if (!agency) {
      redirect('/unauthorized');
    }
  } else {
    redirect('/unauthorized');
  }

  // Default to portal for partner agencies and sales
  redirect('/portal');
}
