'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { toast } from 'sonner'
import { 
  FileSpreadsheet, 
  ChevronRight,
  HelpCircle,
  FileCheck,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion'
import { ExcelFormatPreview } from '@/components/import/excel-format-preview'
import { FileUploadZone } from '@/components/import/file-upload-zone'
import { ImportWizard } from '@/components/import/import-wizard'

interface ImportPageClientProps {
  locale: string
  orgId: string
  type: 'departments' | 'positions'
}

export function ImportPageClient({ locale, orgId, type }: ImportPageClientProps) {
  const t = useTranslations('import')
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  // Automatically process file when selected
  const handleFileSelect = async (file: File | null) => {
    setSelectedFile(file)
    
    if (file) {
      // File is selected, wizard will handle the upload and processing
      setIsImporting(true)
    }
  }

  const handleImportSuccess = (stats?: { departments?: number; positions?: number }) => {
    // Show success toast
    const count = stats?.departments || 0
    toast.success('Import Successful!', {
      description: `${count} department${count !== 1 ? 's' : ''} imported successfully`,
      icon: <CheckCircle2 className="h-5 w-5" />,
      duration: 5000,
    })
    
    // Redirect to departments list page
    router.push(`/${locale}/dashboard/${orgId}/org-structure/departments`)
  }

  // Handle going back to file selection
  const handleBackToUpload = () => {
    setSelectedFile(null)
    setIsImporting(false)
  }

  const pageTitle = type === 'departments' 
    ? t('hero.titleDepartments')
    : t('hero.titlePositions')

  const pageDescription = type === 'departments'
    ? t('hero.descriptionDepartments')
    : t('hero.descriptionPositions')

  const breadcrumbs = [
    { label: t('breadcrumb.orgStructure'), href: `/${locale}/dashboard/${orgId}/org-structure` },
    { 
      label: type === 'departments' ? t('breadcrumb.departments') : t('breadcrumb.positions'),
      href: `/${locale}/dashboard/${orgId}/org-structure/${type}`
    },
    { label: t('breadcrumb.import'), href: '#' }
  ]

  // FAQ data
  const faqs = [
    {
      question: 'What file format is supported?',
      answer: 'We support Excel files (.xlsx and .xls). Maximum file size is 10MB.'
    },
    {
      question: 'Can I import multiple files at once?',
      answer: 'Currently, you can upload one file at a time. After completing one import, you can start another.'
    },
    {
      question: 'What happens to existing data?',
      answer: 'Records with matching codes will be updated with new values. New codes will create new records. No data is deleted during import.'
    },
    {
      question: 'Can I undo an import?',
      answer: 'Imports cannot be automatically undone. However, you can manually edit or delete imported records from the management pages.'
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm py-2.5 border-b">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Page Header */}
          <div className="flex items-center gap-3 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-semibold tracking-tight">
                {pageTitle}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {pageDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {!selectedFile ? (
          <div className="space-y-4">
            {/* Quick Info Alert */}
            <Alert className="py-2.5">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="text-sm">Before you start</AlertTitle>
              <AlertDescription className="text-xs">
                Use unique codes for each {type === 'departments' ? 'department' : 'position'}. 
                Parent codes must reference existing {type === 'departments' ? 'departments' : 'items'} to create hierarchy.
              </AlertDescription>
            </Alert>

            {/* Format Preview */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">File Format Requirements</CardTitle>
                <CardDescription className="text-xs">
                  Your Excel file must follow this exact format
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <ExcelFormatPreview 
                  defaultType={type}
                  showBoth={false}
                />
              </CardContent>
            </Card>

            {/* Upload Zone */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Upload Your File</CardTitle>
                <CardDescription className="text-xs">
                  Drag and drop or click to upload your completed Excel file
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <FileUploadZone
                  file={selectedFile}
                  onFileSelect={handleFileSelect}
                  disabled={isImporting}
                />
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <FileCheck className="h-3.5 w-3.5" />
                  <span>Supported formats: .xlsx, .xls • Maximum size: 10MB</span>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-xs font-medium py-2.5">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground pb-2.5">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Import Wizard - Process the file */
          <div className="max-w-4xl mx-auto">
            <ImportWizard
              onSuccess={handleImportSuccess}
              onBackToUpload={handleBackToUpload}
              importType={type}
              initialFile={selectedFile}
            />
          </div>
        )}
      </div>
    </div>
  )
}
