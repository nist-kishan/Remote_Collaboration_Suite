import React from 'react';
import { useParams } from 'react-router-dom';
import DocumentEditor from '../../components/documents/DocumentEditorMain';

export default function EditDocument() {
  const { documentId } = useParams();
  return <DocumentEditor documentId={documentId} />;
}
