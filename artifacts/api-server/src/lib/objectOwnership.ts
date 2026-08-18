import { db, objectUploadsTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

const OBJECTS_RE = /(\/objects\/[^?#]+)/;

/**
 * Authorization guard for media rows: when a url/objectPath string references
 * a private object ("/objects/..."), the object must have been uploaded by
 * this user (recorded at upload-URL issuance). Prevents a user from turning
 * someone else's object path into a media row — and thereby into a signed,
 * streamable URL. Strings without a private object path (external URLs)
 * are allowed.
 */
export async function userOwnsObjectPath(
  userId: string,
  urlOrPath: string | null | undefined,
): Promise<boolean> {
  if (!urlOrPath) return true;
  const match = OBJECTS_RE.exec(urlOrPath);
  if (!match) return true;
  const [row] = await db
    .select({ objectPath: objectUploadsTable.objectPath })
    .from(objectUploadsTable)
    .where(
      and(
        eq(objectUploadsTable.objectPath, match[1]),
        eq(objectUploadsTable.userId, userId),
      ),
    );
  return !!row;
}
