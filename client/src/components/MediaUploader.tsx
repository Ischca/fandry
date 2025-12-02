import React, { useCallback, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, Image, Film, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UploadedMedia {
  id?: number;
  url: string;
  key: string;
  type: "image" | "video";
  mimeType: string;
  size: number;
}

interface MediaUploaderProps {
  value: UploadedMedia[];
  onChange: (media: UploadedMedia[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function MediaUploader({
  value = [],
  onChange,
  maxFiles = 10,
  disabled = false,
}: MediaUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());

  const { data: config } = trpc.upload.getConfig.useQuery();
  const getPresignedUrlMutation = trpc.upload.getPresignedUrl.useMutation();
  const confirmUploadMutation = trpc.upload.confirmUpload.useMutation();

  const isConfigured = config?.isConfigured ?? false;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadFile = async (file: File): Promise<UploadedMedia | null> => {
    const fileId = `${file.name}-${Date.now()}`;

    try {
      // Get presigned URL
      setUploadingFiles((prev) => new Map(prev).set(fileId, 0));

      const { url, key, publicUrl } = await getPresignedUrlMutation.mutateAsync({
        fileName: file.name,
        contentType: file.type,
        fileSize: file.size,
      });

      // Upload to R2
      setUploadingFiles((prev) => new Map(prev).set(fileId, 30));

      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      setUploadingFiles((prev) => new Map(prev).set(fileId, 70));

      // Get image dimensions if it's an image
      let width: number | undefined;
      let height: number | undefined;

      if (file.type.startsWith("image/")) {
        const dimensions = await getImageDimensions(file);
        width = dimensions.width;
        height = dimensions.height;
      }

      // Confirm upload
      const mediaRecord = await confirmUploadMutation.mutateAsync({
        key,
        url: publicUrl,
        mimeType: file.type,
        size: file.size,
        width,
        height,
      });

      setUploadingFiles((prev) => {
        const newMap = new Map(prev);
        newMap.delete(fileId);
        return newMap;
      });

      return {
        id: mediaRecord.id,
        url: publicUrl,
        key,
        type: file.type.startsWith("image/") ? "image" : "video",
        mimeType: file.type,
        size: file.size,
      };
    } catch (error) {
      setUploadingFiles((prev) => {
        const newMap = new Map(prev);
        newMap.delete(fileId);
        return newMap;
      });

      const message = error instanceof Error ? error.message : "Upload failed";
      toast.error(`${file.name}: ${message}`);
      return null;
    }
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!isConfigured) {
        toast.error("ストレージが設定されていません");
        return;
      }

      const fileArray = Array.from(files);
      const remainingSlots = maxFiles - value.length;

      if (fileArray.length > remainingSlots) {
        toast.error(`最大${maxFiles}ファイルまでアップロードできます`);
        return;
      }

      // Filter valid files
      const validFiles = fileArray.filter((file) => {
        if (!config?.allowedTypes.includes(file.type)) {
          toast.error(`${file.name}: 対応していないファイル形式です`);
          return false;
        }

        const isImage = file.type.startsWith("image/");
        const maxSize = isImage ? config.maxImageSize : config.maxVideoSize;

        if (file.size > maxSize) {
          toast.error(`${file.name}: ファイルサイズが大きすぎます (最大 ${formatFileSize(maxSize)})`);
          return false;
        }

        return true;
      });

      // Upload files
      const uploadPromises = validFiles.map((file) => uploadFile(file));
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((r): r is UploadedMedia => r !== null);

      if (successfulUploads.length > 0) {
        onChange([...value, ...successfulUploads]);
        toast.success(`${successfulUploads.length}ファイルをアップロードしました`);
      }
    },
    [config, isConfigured, maxFiles, value, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;
      handleFiles(e.dataTransfer.files);
    },
    [disabled, handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
      e.target.value = "";
    },
    [handleFiles]
  );

  const removeMedia = useCallback(
    (index: number) => {
      const newMedia = [...value];
      newMedia.splice(index, 1);
      onChange(newMedia);
    },
    [value, onChange]
  );

  const isUploading = uploadingFiles.size > 0;

  if (!isConfigured) {
    return (
      <Card className="p-4 border-dashed border-2 border-muted">
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">ストレージが設定されていません</p>
            <p className="text-sm">
              メディアアップロードを使用するには、R2の環境変数を設定してください。
              代わりに画像URLを直接入力することもできます。
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${isDragOver ? "border-primary bg-primary/5" : "border-muted"}
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}
        `}
      >
        <input
          type="file"
          multiple
          accept={config?.allowedTypes.join(",")}
          onChange={handleFileInput}
          disabled={disabled || isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center gap-2 text-center">
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                アップロード中... ({uploadingFiles.size}ファイル)
              </p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">ドラッグ&ドロップまたはクリックしてアップロード</p>
              <p className="text-sm text-muted-foreground">
                画像: JPG, PNG, GIF, WebP (最大 {formatFileSize(config?.maxImageSize || 0)})
              </p>
              <p className="text-sm text-muted-foreground">
                動画: MP4, WebM (最大 {formatFileSize(config?.maxVideoSize || 0)})
              </p>
            </>
          )}
        </div>
      </div>

      {/* Uploaded media preview */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {value.map((media, index) => (
            <div
              key={media.key}
              className="relative group aspect-video rounded-lg overflow-hidden bg-muted"
            >
              {media.type === "image" ? (
                <img
                  src={media.url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              {/* Type indicator */}
              <div className="absolute bottom-2 left-2">
                {media.type === "image" ? (
                  <Image className="h-4 w-4 text-white drop-shadow-lg" />
                ) : (
                  <Film className="h-4 w-4 text-white drop-shadow-lg" />
                )}
              </div>

              {/* Remove button */}
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeMedia(index)}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>

              {/* File size */}
              <div className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded">
                {formatFileSize(media.size)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File count indicator */}
      <p className="text-xs text-muted-foreground text-right">
        {value.length} / {maxFiles} ファイル
      </p>
    </div>
  );
}
