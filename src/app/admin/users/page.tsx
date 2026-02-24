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
                <h1 className="text-2xl font-bold tracking-tight">Controle de Acesso</h1>
                <p className="text-gray-500">Gerencie usuários, permissões e agências parceiras.</p>
            </div>

            <UserControlClient initialUsers={dbUsers} agencies={agencies} />
        </div>
    );
}
