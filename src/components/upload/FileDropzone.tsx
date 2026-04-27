import { useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { Button } from "@/components/ui/button";
import { isDesktopRuntime } from "@/lib/backend";
import { createBrowserSelectedFiles, createDesktopSelectedFiles } from "@/lib/inputFiles";
import { cn } from "@/lib/utils";
import type { SelectedInputFile } from "@/types/tools";

interface FileDropzoneProps {
  acceptedExtensions: string[];
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  onFilesAdded: (files: SelectedInputFile[]) => void;
  onFileDialogError?: (message: string) => void;
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
  onFileDialogError,
}: FileDropzoneProps) {
  const desktop = isDesktopRuntime();
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
    disabled: disabled || desktop,
    multiple,
    maxFiles,
    accept,
    onDropAccepted: (files) => onFilesAdded(createBrowserSelectedFiles(files)),
  });

  async function handleDesktopSelect() {
    if (disabled) {
      return;
    }

    try {
      const selected = await openDialog({
        directory: false,
        multiple,
        filters: [
          {
            name: "Supported files",
            extensions: acceptedExtensions,
          },
        ],
      });

      if (!selected) {
        return;
      }

      onFilesAdded(createDesktopSelectedFiles(selected));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "The native file picker could not be opened in this runtime.";
      onFileDialogError?.(message);
    }
  }

  if (desktop) {
    return (
      <div className="upload-dropzone">
        <Upload className="h-10 w-10 text-muted-foreground" />
        <h3 className="text-base font-semibold text-foreground">Select local files</h3>
        <p className="text-sm text-muted-foreground">
          Desktop mode uses the native file picker so the backend receives the original file paths.
        </p>
        <Button type="button" onClick={() => void handleDesktopSelect()} disabled={disabled}>
          Choose files
        </Button>
        <p className="text-sm text-muted-foreground">
          Accepted: {acceptedExtensions.map((ext) => `.${ext}`).join(", ")}
        </p>
      </div>
    );
  }

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
      <input {...getInputProps({ disabled: Boolean(disabled) })} />
      <Upload className="h-10 w-10 text-muted-foreground" />
      <h3 className="text-base font-semibold text-foreground">Drop files here or click to upload</h3>
      <p className="text-sm text-muted-foreground">
        Accepted: {acceptedExtensions.map((ext) => `.${ext}`).join(", ")}
      </p>
    </div>
  );
}
