import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useTransactions, transformTransactions } from "../hooks/useTransactions";
import { useUploadPdf } from "../hooks/useUploadPdf";
import { useSubmitPdfPassword } from "../hooks/useSubmitPdfPassword";
import { useUpdateTransaction } from "../hooks/useUpdateTransaction";
import { Button } from "@tagmyexpenses/ui";
import { PDFUploadDropzone } from "@tagmyexpenses/ui";
import { TransactionTable } from "@tagmyexpenses/ui";
import { Input } from "@tagmyexpenses/ui";
import { Sidebar } from "../components/Sidebar";
import { LogOut } from "lucide-react";

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [pendingPdfId, setPendingPdfId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  
  // Debounce search input with 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, refetch } = useTransactions({ 
    page, 
    pageSize: 20, 
    search: debouncedSearch || undefined,
    category: category || undefined,
  });
  const uploadPdf = useUploadPdf();
  const submitPassword = useSubmitPdfPassword();
  const updateTransaction = useUpdateTransaction();

  const transformedTransactions = useMemo(() => {
    if (!data?.transactions) return [];
    return transformTransactions(data.transactions);
  }, [data?.transactions]);

  const handleFileSelect = async (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPassword("");
      setPendingPdfId(null);
      return;
    }
    
    setSelectedFile(file);
    setPendingPdfId(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      const result = await uploadPdf.mutateAsync({ file: selectedFile });
      
      if (result.needsPassword && result.pendingPdfId) {
        // PDF needs password
        setPendingPdfId(result.pendingPdfId);
        setPassword("");
      } else if (result.success) {
        // Successfully processed
        setSelectedFile(null);
        setPassword("");
        setPendingPdfId(null);
        refetch();
      }
    } catch (error) {
      console.error("Failed to upload PDF:", error);
    }
  };

  const handleSubmitPassword = async () => {
    if (!pendingPdfId || !password.trim()) return;
    
    try {
      await submitPassword.mutateAsync({ 
        pendingPdfId, 
        password: password.trim() 
      });
      setSelectedFile(null);
      setPassword("");
      setPendingPdfId(null);
      refetch();
    } catch (error) {
      console.error("Failed to submit password:", error);
    }
  };

  const handleCategoryEdit = async (id: string, category: string) => {
    try {
      await updateTransaction.mutateAsync({ id, category });
      refetch();
    } catch (error) {
      console.error("Failed to update transaction:", error);
    }
  };

  const handleSearchChange = (newSearch: string) => {
    setSearchInput(newSearch);
    // Page reset is handled in the debounce effect
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setPage(1); // Reset to first page when category changes
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Upload Section */}
            <div>
              <h2 className="mb-4 text-lg font-semibold">Upload PDF Statement</h2>
              <PDFUploadDropzone
                onFileSelect={handleFileSelect}
                acceptedFile={selectedFile}
                isLoading={uploadPdf.isPending || submitPassword.isPending}
              />
              {pendingPdfId ? (
                <div className="mt-4 space-y-4">
                  <div className="rounded-md bg-yellow-500/10 p-3 text-sm text-yellow-600">
                    PDF is password protected. Please enter the password to continue.
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      PDF Password
                    </label>
                    <Input
                      type="password"
                      placeholder="Enter PDF password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={submitPassword.isPending}
                      className="w-full max-w-md"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmitPassword}
                      disabled={submitPassword.isPending || !password.trim()}
                    >
                      {submitPassword.isPending ? "Processing..." : "Submit Password"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPendingPdfId(null);
                        setPassword("");
                        setSelectedFile(null);
                      }}
                      disabled={submitPassword.isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                  {submitPassword.isError && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {submitPassword.error?.message || "Failed to process PDF with password"}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {selectedFile && (
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={handleUpload}
                        disabled={uploadPdf.isPending}
                      >
                        {uploadPdf.isPending ? "Uploading..." : "Upload PDF"}
                      </Button>
                    </div>
                  )}
                  {uploadPdf.isError && (
                    <div className="mt-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                      {uploadPdf.error?.message || "Failed to upload PDF"}
                    </div>
                  )}
                  {uploadPdf.isSuccess && uploadPdf.data?.success && (
                    <div className="mt-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600">
                      PDF uploaded successfully! {uploadPdf.data?.count || 0} transactions imported.
                    </div>
                  )}
                  {submitPassword.isSuccess && (
                    <div className="mt-2 rounded-md bg-green-500/10 p-3 text-sm text-green-600">
                      PDF processed successfully! {submitPassword.data?.count || 0} transactions imported.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Transactions Section */}
            <div>
              <h2 className="mb-4 text-lg font-semibold">Transactions</h2>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading transactions...</div>
                </div>
              ) : (
                <TransactionTable
                  transactions={transformedTransactions}
                  onCategoryEdit={handleCategoryEdit}
                  page={page}
                  pageSize={20}
                  total={data?.pagination?.total}
                  totalPages={data?.pagination?.totalPages}
                  totalAmount={data?.totalAmount}
                  currency={transformedTransactions[0]?.currency || "BRL"}
                  search={searchInput}
                  category={category}
                  onSearchChange={handleSearchChange}
                  onCategoryChange={handleCategoryChange}
                  onPageChange={setPage}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

