import React from 'react';
import { sanitizeRichTextForDisplay } from '../lib/richText';

interface RichTextContentProps {
  value: string;
  className?: string;
}

const RichTextContent: React.FC<RichTextContentProps> = ({ value, className = '' }) => (
  <div
    className={`event-rich-text ${className}`.trim()}
    dangerouslySetInnerHTML={{ __html: sanitizeRichTextForDisplay(value) }}
  />
);

export default RichTextContent;
