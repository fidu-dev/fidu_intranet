import { redirect } from 'next/navigation';

export default async function Home() {
  // Redirect directly to portal - no authentication required
  redirect('/portal');
}
