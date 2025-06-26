import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, Eye, Check, X, Clock, Download } from "lucide-react";
import type { Document } from "@shared/schema";

function DocumentCard({ document }: { document: Document }) {
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: async ({ documentId, isApproved }: { documentId: string; isApproved: boolean }) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved, approvedBy: 'current-user-id' })
      });
      if (!response.ok) throw new Error('Failed to update document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    }
  });

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'pod':
        return <FileText className="h-8 w-8 text-green-600" />;
      case 'load_slip':
        return <FileText className="h-8 w-8 text-blue-600" />;
      case 'delivery_note':
        return <FileText className="h-8 w-8 text-purple-600" />;
      case 'signature':
        return <FileText className="h-8 w-8 text-orange-600" />;
      default:
        return <FileText className="h-8 w-8 text-gray-600" />;
    }
  };

  const getStatusBadge = () => {
    if (document.isApproved) {
      return <span className="status-badge status-delivered">Approved</span>;
    }
    return <span className="status-badge status-pending">Pending Review</span>;
  };

  return (
    <div className="workflow-card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getDocumentIcon(document.type)}
          <div>
            <h3 className="font-semibold">{document.originalName || document.filename}</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {document.type.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Transport ID:</span>
          <span className="font-medium">{document.transportId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Uploaded:</span>
          <span>{new Date(document.createdAt).toLocaleDateString()}</span>
        </div>
        {document.fileSize && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Size:</span>
            <span>{Math.round(document.fileSize / 1024)} KB</span>
          </div>
        )}
      </div>

      {document.notes && (
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <p className="text-sm">{document.notes}</p>
        </div>
      )}

      <div className="flex space-x-2">
        <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 border border-border rounded-md hover:bg-accent transition-colors">
          <Eye className="h-4 w-4" />
          <span>View</span>
        </button>
        
        {!document.isApproved && (
          <>
            <button
              onClick={() => approveMutation.mutate({ documentId: document.id, isApproved: true })}
              disabled={approveMutation.isPending}
              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Check className="h-4 w-4" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => approveMutation.mutate({ documentId: document.id, isApproved: false })}
              disabled={approveMutation.isPending}
              className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Reject</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Documents() {
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      const response = await fetch('/api/documents/pending');
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });

  const filteredDocuments = documents?.filter(doc => {
    if (statusFilter === 'pending') return !doc.isApproved;
    if (statusFilter === 'approved') return doc.isApproved;
    return true;
  }) || [];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Document Management</h1>
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background"
          >
            <option value="all">All Documents</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Document Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="workflow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-bold">{documents?.length || 0}</p>
            </div>
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        
        <div className="workflow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold">{documents?.filter(d => !d.isApproved).length || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="workflow-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{documents?.filter(d => d.isApproved).length || 0}</p>
            </div>
            <Check className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="workflow-card animate-pulse">
              <div className="flex items-center space-x-3 mb-4">
                <div className="h-8 w-8 bg-muted rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded"></div>
              </div>
              <div className="flex space-x-2">
                <div className="flex-1 h-8 bg-muted rounded"></div>
                <div className="flex-1 h-8 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredDocuments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map(document => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No documents found</h3>
          <p className="text-muted-foreground">
            {statusFilter !== 'all' 
              ? `No ${statusFilter} documents at this time`
              : 'Documents will appear here when uploaded by drivers'
            }
          </p>
        </div>
      )}
    </div>
  );
}