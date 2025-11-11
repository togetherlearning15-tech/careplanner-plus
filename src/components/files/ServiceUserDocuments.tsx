import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase-care";

type Props = {
  serviceUserId: string; // <-- REQUIRED: the service_users.id
};

type FileRow = {
  id: string;
  bucket: string;
  path: string;
  title: string | null;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
};

function formatKb(bytes?: number | null) {
  if (!bytes) return "0 KB";
  return `${Math.round(bytes / 1024)} KB`;
}

export default function ServiceUserDocuments({ serviceUserId }: Props) {
  const bucket = "documents";
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  const [rows, setRows] = useState<FileRow[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // ----- LIST FILES (from file_objects) -----
  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setError("");
      const { data, error } = await supabase
        .from("file_objects")
        .select("id,bucket,path,title,file_type,file_size,created_at")
        .eq("bucket", bucket)
        .eq("related_entity_type", "service_user")
        .eq("related_entity_id", serviceUserId)
        .order("created_at", { ascending: false });

      if (!ignore) {
        if (error) setError(error.message);
        else setRows((data as FileRow[]) || []);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [serviceUserId, bucket, refreshKey]);

  // ----- UPLOAD + INSERT METADATA -----
  const handleUpload = async () => {
    if (!file) return;
    setBusy(true);
    setError("");

    try {
      // 1) choose a storage path: keep it stable & unique
      const safeName = file.name.replace(/\s+/g, "_");
      const path = `service_user/${serviceUserId}/${Date.now()}_${safeName}`;

      // 2) upload to Storage
      const { error: uploadErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: false, // keep history
          cacheControl: "3600",
        });
      if (uploadErr) throw uploadErr;

      // 3) insert metadata into file_objects (CRITICAL for RLS to allow reads)
      const { error: metaErr } = await supabase.from("file_objects").insert({
        bucket,
        path,                       // MUST match storage.objects.name
        title: file.name,
        file_type: file.type,
        file_size: file.size,
        related_entity_type: "service_user",
        related_entity_id: serviceUserId,
      });
      if (metaErr) throw metaErr;

      setFile(null);
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      setError(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  // ----- DOWNLOAD via signed URL -----
  const handleDownload = async (row: FileRow) => {
    const { data, error } = await supabase.storage
      .from(row.bucket)
      .createSignedUrl(row.path, 60); // seconds
    if (error || !data?.signedUrl) {
      setError(error?.message || "Could not create download URL");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Upload */}
      <div className="flex items-center gap-2">
        <input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="border rounded px-3 py-2"
        />
        <button
          onClick={handleUpload}
          disabled={!file || busy}
          className="bg-teal-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {busy ? "Uploading..." : "Upload document"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {/* List */}
      <div className="space-y-2">
        {rows.length === 0 && (
          <p className="text-sm text-gray-500">No documents uploaded yet.</p>
        )}

        {rows.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between rounded border px-3 py-2"
          >
            <div>
              <div className="font-medium">
                {r.title || r.path.split("/").slice(-1)[0]}
              </div>
              <div className="text-xs text-gray-500">
                {r.file_type || "unknown"} • {formatKb(r.file_size)}
              </div>
            </div>
            <button
              onClick={() => handleDownload(r)}
              className="text-teal-700 underline"
            >
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
