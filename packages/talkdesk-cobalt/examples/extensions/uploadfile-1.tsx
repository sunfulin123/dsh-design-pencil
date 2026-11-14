import { useState } from "react";
import { UploadFile, FormField } from "../../components/extensions/src";
export default function Demo() {
  const [file, setFile] = useState<File | null>(null);
  return (
    <FormField label="Events" description="Only .csv files up to 10MB are supported.">
      <UploadFile file={file} onFileChange={setFile} data-qa="basic-upload" />
    </FormField>
  );
}
