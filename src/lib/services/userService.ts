import { getUserCapabilities } from '../auth/getUserCapabilities'
import { UserCapabilities } from '../domain/types'

export async function getAgencyByEmail(email: string): Promise<UserCapabilities | null> {
    return await getUserCapabilities(email)
}
