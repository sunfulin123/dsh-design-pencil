import { useState } from "react";
import { UploadFile, FormField } from "../../components/extensions/src";
const mockFile = new File(["col1,col2\n1,2"], "forecast_template.csv", {
  type: "text/csv",
});
export default function Demo() {
  const [file, setFile] = useState<File | null>(mockFile);
  return (
    <FormField label="Events" description="Only .csv files up to 10MB are supported.">
      <UploadFile accept=".csv" file={file} onFileChange={setFile} data-qa="uploaded-state" />
    </FormField>
  );
}
