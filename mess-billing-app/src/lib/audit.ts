import { prisma } from './prisma';
import { Prisma } from '@prisma/client';

/**
 * Sets the audit user context for the current transaction.
 * The audit_trigger_func() reads this via current_setting('app.audit_user', true).
 *
 * Usage in API routes:
 *   await prisma.$transaction(async (tx) => {
 *       await setAuditUser(tx, userId);
 *       // ... your mutations here
 *   });
 */
export async function setAuditUser(
    tx: Prisma.TransactionClient,
    userId: string
): Promise<void> {
    const sanitized = userId.replace(/'/g, "''");
    await tx.$executeRawUnsafe(`SET LOCAL "app.audit_user" = '${sanitized}'`);
}

/**
 * Wraps a callback in a transaction with audit user context set.
 * For routes that need a simple single-operation audit trail.
 *
 * Usage:
 *   const result = await withAuditUser(userId, async (tx) => {
 *       return tx.$queryRaw`SELECT sp_create_fee_payment(...)`;
 *   });
 */
export async function withAuditUser<T>(
    userId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
    return prisma.$transaction(async (tx) => {
        await setAuditUser(tx, userId);
        return fn(tx);
    });
}
