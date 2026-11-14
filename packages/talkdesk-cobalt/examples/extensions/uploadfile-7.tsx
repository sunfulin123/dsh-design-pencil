import { useState } from "react";
import { UploadFile, FormField } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
const mockFile = new File(["col1,col2\n1,2"], "report.csv", {
  type: "text/csv",
});
export default function Demo() {
  const [f1, setF1] = useState<File | null>(null);
  const [f2, setF2] = useState<File | null>(mockFile);
  return (
    <Flex gap="6" wrap>
      <FormField label="Error — no file" errorHint="A CSV file is required" variation="error">
        <UploadFile
          accept=".csv"
          file={f1}
          variation="error"
          onFileChange={setF1}
          data-qa="error-upload"
        />
      </FormField>
      <FormField
        label="Warning — review file"
        warningHint="Please verify the file before continuing"
        variation="warning"
      >
        <UploadFile
          accept=".csv"
          file={f2}
          variation="warning"
          onFileChange={setF2}
          data-qa="warning-upload"
        />
      </FormField>
    </Flex>
  );
}
