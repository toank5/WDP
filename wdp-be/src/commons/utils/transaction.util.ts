import { ClientSession, Connection } from 'mongoose';

/**
 * Executes a callback function within a MongoDB transaction.
 * Automatically handles transaction lifecycle: start, commit, abort, and session cleanup.
 *
 * @param connection - Mongoose connection instance
 * @param callback - Async function to execute within the transaction, receives the session as parameter
 * @returns Promise resolving to the callback's return value
 * @throws Re-throws any error that occurs during transaction execution after aborting
 *
 * @example
 * ```typescript
 * const result = await withTransaction(this.connection, async (session) => {
 *   const user = await this.userModel.create([{ name: 'John' }], { session });
 *   const profile = await this.profileModel.create([{ userId: user[0]._id }], { session });
 *   return { user: user[0], profile: profile[0] };
 * });
 * ```
 */
export async function withTransaction<T>(
  connection: Connection,
  callback: (session: ClientSession) => Promise<T>,
): Promise<T> {
  const session: ClientSession = await connection.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}
