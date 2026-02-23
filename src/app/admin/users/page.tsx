import { getUsers, updateUserAccess, getAgencies } from '@/app/admin/actions';
import { UserControlClient } from './UserControlClient';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { getAgencyByEmail } from '@/lib/services/userService';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
    const user = await currentUser();
    if (!user) redirect('/sign-in');

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) redirect('/sign-in');

    const capabilities = await getAgencyByEmail(email);
    if (!capabilities?.isAdmin) {
        redirect('/unauthorized');
    }

    const dbUsers = await getUsers();
    const agencies = await getAgencies();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Access Control</h1>
                <p className="text-gray-500">Gerenciar usuários, permissões de sistema e nomes de agências cruzados.</p>
            </div>

            <UserControlClient initialUsers={dbUsers} agencies={agencies} />
        </div>
    );
}
