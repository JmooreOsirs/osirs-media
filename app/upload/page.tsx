"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Upload, Copy, Trash2, Check, Image, FileIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BlobFile {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function isImage(pathname: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg|avif|ico)$/i.test(pathname);
}

export default function UploadPage() {
  const [files, setFiles] = useState<BlobFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "images">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        const data = await res.json();
        setFiles(data.blobs || []);
      }
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      for (const file of Array.from(fileList)) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          setError(`Upload failed: ${err.error || res.statusText}`);
          return;
        }
      }
      await fetchFiles();
    } catch (err) {
      setError(`Upload error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  }, [fetchFiles]);

  const handleDelete = async (url: string) => {
    try {
      const res = await fetch("/api/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.url !== url));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleUpload(e.dataTransfer.files);
    },
    [handleUpload]
  );

  const filteredFiles =
    filter === "images" ? files.filter((f) => isImage(f.pathname)) : files;

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Upload Zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
          dragActive
            ? "border-blue-500 bg-blue-500/10"
            : "border-white/20 hover:border-white/40 bg-white/[0.02]"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <Upload
          className={`mx-auto mb-4 ${
            dragActive ? "text-blue-500" : "text-white/40"
          }`}
          size={48}
        />
        <p className="text-lg font-medium mb-1">
          {uploading
            ? "Uploading..."
            : dragActive
            ? "Drop files here"
            : "Drag & drop files here"}
        </p>
        <p className="text-sm text-white/50">
          or click to browse • Images (JPG, PNG, GIF, WebP, SVG) & Video
        </p>
        {uploading && (
          <div className="mt-4">
            <div className="w-48 mx-auto h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full animate-pulse w-3/4" />
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Filter & Files */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            Files{" "}
            <span className="text-white/40 text-base font-normal">
              ({filteredFiles.length})
            </span>
          </h2>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className="gap-1.5"
            >
              <FileIcon size={14} />
              All
            </Button>
            <Button
              variant={filter === "images" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("images")}
              className="gap-1.5"
            >
              <Image size={14} />
              Images
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/40">Loading files...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-20 text-white/40">
            <Filter className="mx-auto mb-3" size={32} />
            <p>No files yet. Upload something!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.url}
                className="group bg-white/[0.03] border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-colors"
              >
                {/* Thumbnail */}
                <div className="aspect-square bg-white/[0.02] flex items-center justify-center overflow-hidden">
                  {isImage(file.pathname) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.url}
                      alt={file.pathname}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <FileIcon size={48} className="text-white/20" />
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-medium truncate" title={file.pathname}>
                    {file.pathname}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {formatBytes(file.size)}
                    </Badge>
                    <span className="text-xs text-white/40">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-xs"
                      onClick={() => copyUrl(file.url)}
                    >
                      {copiedUrl === file.url ? (
                        <>
                          <Check size={12} /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> Copy URL
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => handleDelete(file.url)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
