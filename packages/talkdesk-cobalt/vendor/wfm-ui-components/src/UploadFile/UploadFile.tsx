/* eslint-disable complexity */
import React, { useRef, useState } from 'react';
import Button from '@talkdesk/cobalt-react-button';
import Flex from '@talkdesk/cobalt-react-flex';
import Icon from '@talkdesk/cobalt-react-icon';
import { cssVar, useTheme } from '@talkdesk/cobalt-react-theme-provider';
import { Text } from '@talkdesk/cobalt-react-typography';

export type UploadFileError = 'invalidType' | 'tooLarge';

export type UploadFileProps = {
  /** Currently selected file, or null when nothing is selected. */
  file: File | null;
  /** Called with a new File when the user picks a valid file, or null when the user removes it. */
  onFileChange: (file: File | null) => void;
  /** Native file input accept string, e.g. ".csv" or "image/*". Defaults to "*" (all files). */
  accept?: string;
  /** Maximum allowed file size in bytes. When omitted, size is not validated. */
  maxSizeBytes?: number;
  /** Helper text shown below the drag-text inside the drop zone, e.g. "Only .csv files up to 10MB". */
  description?: string;
  /** URL opened when the user clicks "Download template". Omit to hide the link. */
  templateUrl?: string;
  /** Text for the "Download template" link. Defaults to "Download template". */
  templateLabel?: string;
  /** Primary text inside the drop zone. Defaults to "Drag a file here or". */
  dragText?: string;
  /** CTA text for the file picker link. Defaults to "Choose a file to upload". */
  chooseFileText?: string;
  /**
   * Called when the user drops or selects a file that fails validation.
   * @param type - `'invalidType'` when the file extension doesn't match `accept`,
   *               `'tooLarge'` when the file exceeds `maxSizeBytes`.
   * @param file - The rejected file.
   */
  onError?: (type: UploadFileError, file: File) => void;
  /** Applies a colored border for form validation feedback. */
  variation?: 'error' | 'warning';
  'data-qa'?: string;
  'data-component'?: string;
};

function getVariationBorder({
  variation,
  idleColor,
  errorColor,
  warningColor,
}: {
  variation: 'error' | 'warning' | undefined;
  idleColor: string;
  errorColor: string;
  warningColor: string;
}): string {
  if (variation === 'error') return errorColor;
  if (variation === 'warning') return warningColor;

  return idleColor;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const UploadFile: React.FC<UploadFileProps> = ({
  file,
  onFileChange,
  accept,
  maxSizeBytes,
  description,
  templateUrl,
  templateLabel = 'Download template',
  dragText = 'Drag a file here or',
  chooseFileText = 'Choose a file to upload',
  onError,
  variation,
  'data-qa': dataQa,
  'data-component': dataComponent = 'WFMUploadFile',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const theme = useTheme();

  // Color tokens from Cobalt theme — theme-reactive, adapts to dark/light mode
  const PURPLE = theme.primary9; // brand purple
  const GRAY_TEXT = theme.textDescription; // subdued text
  const BORDER_IDLE = cssVar(theme.gray4, theme.gray6); // neutral border
  const BORDER_DRAG = PURPLE;
  const BG_IDLE = cssVar(theme.surfaceElevation1, theme.gray2);
  const BG_DRAG = cssVar(theme.primarySurface, theme.primary2);
  const BORDER_FILE = cssVar(theme.gray4, theme.gray6); // file card border
  const BORDER_ERROR = theme.error9; // error red border
  const BORDER_WARNING = theme.warning6; // warning amber border

  const validateAndSet = (incoming: File) => {
    if (accept) {
      const acceptedExtensions = accept
        .split(',')
        .map((a) => a.trim().toLowerCase());

      const fileName = incoming.name.toLowerCase();
      const mimeType = incoming.type.toLowerCase();

      const isAccepted = acceptedExtensions.some((ext) => {
        if (ext.startsWith('.')) return fileName.endsWith(ext);
        if (ext.endsWith('/*')) return mimeType.startsWith(ext.slice(0, -2));

        return mimeType === ext;
      });

      if (!isAccepted) {
        onError?.('invalidType', incoming);

        return;
      }
    }

    if (maxSizeBytes !== undefined && incoming.size > maxSizeBytes) {
      onError?.('tooLarge', incoming);

      return;
    }

    onFileChange(incoming);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear when leaving the drop zone itself, not a child element.
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];

    if (droppedFile) validateAndSet(droppedFile);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const selected = e.target.files?.[0];

    if (selected) validateAndSet(selected);
    // Reset value so re-selecting the same file triggers onChange again.
    e.target.value = '';
  };

  const hasTemplate = Boolean(templateUrl);

  return (
    <Flex
      data-component={dataComponent}
      data-qa={dataQa}
      direction="column"
      style={{ position: 'relative' }}
      width="100%"
    >
      {hasTemplate && (
        // Absolutely positioned so the link aligns horizontally with the
        // parent FormField label row (e.g. "File upload *"). `top: -28px`
        // lifts the link up roughly one label-row height; the parent
        // FormField provides a ~24px label + 4px gap above the InputGroup.
        <Flex
          alignY="center"
          data-qa={dataQa ? `${dataQa}-download-template` : undefined}
          gap="2"
          style={{
            position: 'absolute',
            right: 0,
            top: '-22px',
            cursor: 'pointer',
            textDecoration: 'none',
          }}
          onClick={() => window.open(templateUrl, '_blank', 'noopener')}
        >
          <Icon color={PURPLE} name="download" size="tiny" />
          <Text color={PURPLE} weight="medium">
            {templateLabel}
          </Text>
        </Flex>
      )}

      {file ? (
        /* ── Uploaded file card ── */
        <Flex
          data-qa={dataQa ? `${dataQa}-file-card` : undefined}
          direction="column"
          padding="3"
          style={{
            backgroundColor: BG_IDLE,
            border: `2px solid ${
              variation
                ? getVariationBorder({
                    variation,
                    idleColor: BORDER_IDLE,
                    errorColor: BORDER_ERROR,
                    warningColor: BORDER_WARNING,
                  })
                : BORDER_FILE
            }`,
            borderRadius: '4px',
          }}
          width="100%"
        >
          <Flex alignY="center" width="100%">
            <Flex>
              <Icon name="file_outline" size="tiny" />
            </Flex>
            <Flex direction="column" paddingLeft="3">
              <Text weight="medium">{file.name}</Text>
              <Text color={GRAY_TEXT} weight="light">
                {`File size: ${formatFileSize(file.size)}`}
              </Text>
            </Flex>
          </Flex>
          <Flex alignX="end" paddingTop="2" width="100%">
            <Button
              data-qa={dataQa ? `${dataQa}-change-file` : undefined}
              size="small"
              type="secondary"
              variation="transparent"
              onClick={() => fileInputRef.current?.click()}
            >
              <Flex alignY="center" gap="2">
                <Icon name="swap_horiz" size="tiny" />
                <Text weight="medium">Change file</Text>
              </Flex>
            </Button>
            <Button
              data-qa={dataQa ? `${dataQa}-remove-file` : undefined}
              size="small"
              style={{ marginLeft: '8px' }}
              type="secondary"
              variation="transparent"
              onClick={() => onFileChange(null)}
            >
              <Flex alignY="center" gap="2">
                <Icon name="delete_outline" size="tiny" />
                <Text weight="medium">Delete</Text>
              </Flex>
            </Button>
          </Flex>
          <input
            ref={fileInputRef}
            accept={accept}
            data-qa={dataQa ? `${dataQa}-input` : undefined}
            style={{ display: 'none' }}
            type="file"
            onChange={handleInputChange}
          />
        </Flex>
      ) : (
        /* ── Drop zone ── */
        <Flex
          alignX="center"
          data-qa={dataQa ? `${dataQa}-dropzone` : undefined}
          direction="column"
          padding="6"
          style={{
            border: `2px dashed ${
              isDragging
                ? BORDER_DRAG
                : getVariationBorder({
                    variation,
                    idleColor: BORDER_IDLE,
                    errorColor: BORDER_ERROR,
                    warningColor: BORDER_WARNING,
                  })
            }`,
            borderRadius: '8px',
            backgroundColor: isDragging ? BG_DRAG : BG_IDLE,
            transition: 'background-color 150ms ease, border-color 150ms ease',
          }}
          width="100%"
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Icon color={PURPLE} name="folder" size="large" />
          <Flex paddingY="4">
            <Text style={{ fontSize: '24px' }}>{dragText}</Text>
          </Flex>
          <Flex
            alignY="center"
            data-qa={dataQa ? `${dataQa}-choose-file` : undefined}
            gap="2"
            style={{ cursor: 'pointer' }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Icon color={PURPLE} name="add_circle_outline" size="small" />
            <Text color={PURPLE} weight="medium">
              {chooseFileText}
            </Text>
          </Flex>
          {description && (
            <Flex paddingTop="2">
              <Text color={GRAY_TEXT}>{description}</Text>
            </Flex>
          )}
          <input
            ref={fileInputRef}
            accept={accept}
            data-qa={dataQa ? `${dataQa}-input` : undefined}
            style={{ display: 'none' }}
            type="file"
            onChange={handleInputChange}
          />
        </Flex>
      )}
    </Flex>
  );
};
