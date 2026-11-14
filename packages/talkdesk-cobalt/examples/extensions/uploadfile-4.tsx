import type { UploadFileError } from "../../components/extensions/src";
import { useState } from "react";
import { UploadFile, FormField } from "../../components/extensions/src";
export default function Demo() {
  const [file, setFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const handleError = (type: UploadFileError) => {
    if (type === "invalidType") setErrorMsg("Only .csv files are accepted.");
    else setErrorMsg("File exceeds the 10 MB limit.");
    setTimeout(() => setErrorMsg(""), 4000);
  };
  return (
    <FormField
      label="CSV file"
      description="Only .csv files up to 10MB are supported."
      errorHint={errorMsg || undefined}
      variation={errorMsg ? "error" : undefined}
    >
      <UploadFile
        accept=".csv"
        file={file}
        maxSizeBytes={10485760}
        onError={handleError}
        onFileChange={setFile}
        data-qa="validated-upload"
      />
    </FormField>
  );
}
