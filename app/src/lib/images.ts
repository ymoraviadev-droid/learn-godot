export interface ImageInfo {
  filename: string;
  url: string;
  sizeBytes: number;
  modifiedAt: string;
}

export async function listImages(): Promise<ImageInfo[]> {
  const res = await fetch("/api/list-images");
  if (!res.ok) return [];
  return res.json();
}

export async function uploadImage(file: File): Promise<{ url: string; filename: string } | null> {
  const formData = new FormData();
  formData.append("image", file, file.name);
  try {
    const res = await fetch("/api/upload-image", { method: "POST", body: formData });
    const data = await res.json();
    return data.url ? { url: data.url, filename: data.filename } : null;
  } catch {
    return null;
  }
}

export async function deleteImage(filename: string): Promise<boolean> {
  try {
    const res = await fetch("/api/delete-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
