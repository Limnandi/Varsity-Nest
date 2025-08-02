"use client"

import { useState, useEffect } from "react"
import { Download, X } from "lucide-react"
import dynamic from 'next/dynamic'

// Dynamically import react-pdf components to prevent SSR issues
const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  { ssr: false }
)

const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
)

// Configure PDF.js worker only on client side
if (typeof window !== 'undefined') {
  import('react-pdf').then((pdfjs) => {
    pdfjs.pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.pdfjs.version}/pdf.worker.min.js`
  })
}

interface Document {
  url: string
  name: string
  type: string
}

export function DocumentViewer({
  documents,
  isOpen,
  onClose
}: {
  documents: Document[]
  isOpen: boolean
  onClose: () => void
}) {
  const [numPages, setNumPages] = useState<number>()
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Provider Documents</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          {documents.map((doc, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{doc.name}</h4>
                  <p className="text-sm text-gray-500">{doc.type}</p>
                </div>
                <div className="flex space-x-2">
                  {doc.type.startsWith('image/') ? (
                    <img
                      src={doc.url}
                      alt={doc.name}
                      className="max-h-40 max-w-full object-contain"
                    />
                  ) : doc.type === 'application/pdf' ? (
                    <div className="border p-2">
                      {isClient ? (
                        <Document
                          file={doc.url}
                          onLoadSuccess={onDocumentLoadSuccess}
                          className="max-h-40"
                        >
                          <Page pageNumber={pageNumber} width={200} />
                        </Document>
                      ) : (
                        <div className="bg-gray-100 p-4 rounded">
                          <p className="text-sm">Loading PDF preview...</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-100 p-4 rounded">
                      <p className="text-sm">Preview not available</p>
                    </div>
                  )}
                  <a
                    href={doc.url}
                    download={doc.name}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}