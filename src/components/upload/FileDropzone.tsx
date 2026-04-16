import { useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  acceptedExtensions: string[];
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  onFilesAdded: (files: File[]) => void;
}

const extensionToMime: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  tiff: "image/tiff",
  bmp: "image/bmp",
  html: "text/html",
  htm: "text/html",
};

export default function FileDropzone({
  acceptedExtensions,
  multiple = true,
  maxFiles,
  disabled,
  onFilesAdded,
}: FileDropzoneProps) {
  const accept = useMemo(() => {
    if (acceptedExtensions.length === 0) {
      return undefined;
    }

    return acceptedExtensions.reduce<Record<string, string[]>>((acc, ext) => {
      const mime = extensionToMime[ext] ?? "application/octet-stream";
      acc[mime] = [...(acc[mime] ?? []), `.${ext}`];
      return acc;
    }, {});
  }, [acceptedExtensions]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    disabled,
    multiple,
    maxFiles,
    accept,
    onDropAccepted: (files) => onFilesAdded(files),
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "upload-dropzone",
        isDragActive && "upload-dropzone--active",
        isDragReject && "upload-dropzone--reject",
        disabled && "cursor-not-allowed opacity-70",
      )}
    >
      <input {...getInputProps()} />
      <Upload className="h-10 w-10 text-muted-foreground" />
      <h3 className="text-base font-semibold text-foreground">Drop files here or click to upload</h3>
      <p className="text-sm text-muted-foreground">
        Accepted: {acceptedExtensions.map((ext) => `.${ext}`).join(", ")}
      </p>
    </div>
  );
}
