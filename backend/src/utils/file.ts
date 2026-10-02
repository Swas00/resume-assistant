import fs from 'fs';

// Best-effort removal of a temp upload; never throws
export const removeTempFile = (filePath?: string): void => {
  if (!filePath) return;
  try {
    fs.unlinkSync(filePath);
  } catch {
    // already gone or not removable
  }
};
