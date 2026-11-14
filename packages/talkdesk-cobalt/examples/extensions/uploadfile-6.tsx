import { useState } from "react";
import { UploadFile, FormField } from "../../components/extensions/src";
export default function Demo() {
  const [file, setFile] = useState<File | null>(null);
  return (
    <FormField label="Import data">
      <UploadFile
        chooseFileText="Select a spreadsheet"
        description="Supported formats: .xlsx, .csv"
        dragText="Drop your spreadsheet here or"
        file={file}
        onFileChange={setFile}
        data-qa="custom-text-upload"
      />
    </FormField>
  );
}
