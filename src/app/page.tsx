import { redirect } from 'next/navigation';

export default async function Home() {
  // Clerk middleware protects /portal - redirect here as a convenience fallback
  redirect('/portal');
}
