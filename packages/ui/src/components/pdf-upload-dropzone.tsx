import * as React from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { Card } from "./card";

export interface PDFUploadDropzoneProps {
  onFileSelect: (file: File | null) => void;
  acceptedFile?: File | null;
  isLoading?: boolean;
  className?: string;
}

export function PDFUploadDropzone({
  onFileSelect,
  acceptedFile,
  isLoading = false,
  className,
}: PDFUploadDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFileSelect(null);
  };

  // Disable dropzone click when file is selected, but keep drag and drop
  const rootProps = acceptedFile 
    ? { ...getRootProps(), onClick: (e: React.MouseEvent) => e.preventDefault() }
    : getRootProps();

  return (
    <Card className={cn("", className)}>
      <div
        {...rootProps}
        className={cn(
          "relative rounded-lg border-2 border-dashed p-8 transition-colors",
          acceptedFile ? "cursor-default" : "cursor-pointer",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          isLoading && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {acceptedFile ? (
            <>
              <div className="flex items-center gap-2 text-primary">
                <File className="h-8 w-8" />
                <span className="font-medium">{acceptedFile.name}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="mt-2"
              >
                <X className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragActive ? "Drop PDF here" : "Upload PDF Statement"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop a PDF file here, or click to select
                </p>
              </div>
            </>
          )}
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80">
            <div className="text-sm text-muted-foreground">Processing...</div>
          </div>
        )}
      </div>
    </Card>
  );
}

