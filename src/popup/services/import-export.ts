import { normalizeRecording } from '../../shared/schema';
import { listRecordingNames, saveRecording } from './storage';

export function downloadJson(fileName: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function importSingleRecordingFromText(contents: string): Promise<string> {
  const parsed = JSON.parse(contents);
  const normalized = normalizeRecording(parsed);
  if (!normalized) {
    throw new Error('Invalid recording schema');
  }

  const existingNames = new Set(await listRecordingNames());
  let name = normalized.name;
  let counter = 1;
  while (existingNames.has(name)) {
    counter += 1;
    name = `${normalized.name} (${counter})`;
  }

  await saveRecording(name, normalized);
  return name;
}
