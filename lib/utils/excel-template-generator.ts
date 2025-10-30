/**
 * Excel Template Generator
 * 
 * Generates properly formatted Excel (.xlsx) files for importing
 * departments and positions with example data, validation, and formatting.
 */

import * as XLSX from 'xlsx'

export interface TemplateOptions {
  includeExamples?: boolean
  locale?: 'en' | 'tr'
}

/**
 * Generate Excel import template with example data
 */
export function generateImportTemplate(options: TemplateOptions = {}): ArrayBuffer {
  const { includeExamples = true, locale = 'en' } = options

  // Translation helper
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        deptCode: 'Department Code',
        deptName: 'Department Name',
        deptDesc: 'Department Description',
        parentCode: 'Parent Department Code',
        posCode: 'Position Code',
        posTitle: 'Position Title',
        posDesc: 'Position Description',
        deptCodeForPos: 'Department Code',
        empType: 'Employment Type',
        location: 'Location',
        salaryMin: 'Salary Min',
        salaryMax: 'Salary Max',
        currency: 'Salary Currency',
      },
      tr: {
        deptCode: 'Departman Kodu',
        deptName: 'Departman Adı',
        deptDesc: 'Departman Açıklaması',
        parentCode: 'Üst Departman Kodu',
        posCode: 'Pozisyon Kodu',
        posTitle: 'Pozisyon Başlığı',
        posDesc: 'Pozisyon Açıklaması',
        deptCodeForPos: 'Departman Kodu',
        empType: 'İstihdam Türü',
        location: 'Lokasyon',
        salaryMin: 'Maaş Min',
        salaryMax: 'Maaş Max',
        currency: 'Para Birimi',
      },
    }
    return translations[locale][key] || key
  }

  // Create workbook
  const workbook = XLSX.utils.book_new()

  // ========================================================================
  // DEPARTMENTS SHEET
  // ========================================================================

  const departmentsHeaders = [
    t('deptCode'),
    t('deptName'),
    t('deptDesc'),
    t('parentCode'),
  ]

  const departmentsData = includeExamples
    ? [
        ['EXEC', 'Executive', 'Executive Leadership', ''],
        ['TECH', 'Technology', 'Technology Department', ''],
        ['TECH-ENG', 'Engineering', 'Software Engineering Team', 'TECH'],
        ['TECH-OPS', 'Operations', 'DevOps and Infrastructure', 'TECH'],
        ['HR', 'Human Resources', 'HR Department', ''],
        ['SALES', 'Sales', 'Sales and Business Development', ''],
        ['MKT', 'Marketing', 'Marketing and Communications', ''],
        ['FIN', 'Finance', 'Finance and Accounting', ''],
      ]
    : []

  const departmentsSheet = XLSX.utils.aoa_to_sheet([
    departmentsHeaders,
    ...departmentsData,
  ])

  // Set column widths for departments
  departmentsSheet['!cols'] = [
    { wch: 18 }, // Department Code
    { wch: 25 }, // Department Name
    { wch: 35 }, // Description
    { wch: 22 }, // Parent Code
  ]

  // Style header row (bold, background color)
  const departmentsRange = XLSX.utils.decode_range(departmentsSheet['!ref'] || 'A1')
  for (let col = departmentsRange.s.c; col <= departmentsRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!departmentsSheet[cellAddress]) continue
    departmentsSheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E3F2FD' } },
      alignment: { horizontal: 'left', vertical: 'center' },
    }
  }

  XLSX.utils.book_append_sheet(workbook, departmentsSheet, 'Departments')

  // ========================================================================
  // POSITIONS SHEET
  // ========================================================================

  const positionsHeaders = [
    t('posCode'),
    t('posTitle'),
    t('posDesc'),
    t('deptCodeForPos'),
    t('empType'),
    t('location'),
    t('salaryMin'),
    t('salaryMax'),
    t('currency'),
  ]

  const positionsData = includeExamples
    ? [
        [
          'CEO-001',
          'Chief Executive Officer',
          'Company CEO and President',
          'EXEC',
          'FULL_TIME',
          'HQ',
          '200000',
          '300000',
          'USD',
        ],
        [
          'CTO-001',
          'Chief Technology Officer',
          'Head of Technology',
          'TECH',
          'FULL_TIME',
          'HQ',
          '180000',
          '250000',
          'USD',
        ],
        [
          'TECH-ENG-001',
          'Senior Software Engineer',
          'Full-stack software engineer',
          'TECH-ENG',
          'FULL_TIME',
          'Remote',
          '100000',
          '150000',
          'USD',
        ],
        [
          'TECH-ENG-002',
          'Software Engineer',
          'Mid-level software engineer',
          'TECH-ENG',
          'FULL_TIME',
          'Hybrid',
          '80000',
          '120000',
          'USD',
        ],
        [
          'TECH-OPS-001',
          'DevOps Engineer',
          'Infrastructure and deployment',
          'TECH-OPS',
          'FULL_TIME',
          'Remote',
          '90000',
          '140000',
          'USD',
        ],
        [
          'HR-001',
          'HR Manager',
          'Human Resources Manager',
          'HR',
          'FULL_TIME',
          'Office',
          '70000',
          '90000',
          'USD',
        ],
        [
          'SALES-001',
          'Sales Representative',
          'B2B Sales Representative',
          'SALES',
          'FULL_TIME',
          'Field',
          '50000',
          '80000',
          'USD',
        ],
        [
          'MKT-001',
          'Marketing Manager',
          'Marketing and Brand Manager',
          'MKT',
          'FULL_TIME',
          'Office',
          '65000',
          '95000',
          'USD',
        ],
      ]
    : []

  const positionsSheet = XLSX.utils.aoa_to_sheet([positionsHeaders, ...positionsData])

  // Set column widths for positions
  positionsSheet['!cols'] = [
    { wch: 15 }, // Position Code
    { wch: 30 }, // Title
    { wch: 35 }, // Description
    { wch: 18 }, // Department Code
    { wch: 15 }, // Employment Type
    { wch: 12 }, // Location
    { wch: 12 }, // Salary Min
    { wch: 12 }, // Salary Max
    { wch: 10 }, // Currency
  ]

  // Style header row
  const positionsRange = XLSX.utils.decode_range(positionsSheet['!ref'] || 'A1')
  for (let col = positionsRange.s.c; col <= positionsRange.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col })
    if (!positionsSheet[cellAddress]) continue
    positionsSheet[cellAddress].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E8F5E9' } },
      alignment: { horizontal: 'left', vertical: 'center' },
    }
  }

  XLSX.utils.book_append_sheet(workbook, positionsSheet, 'Positions')

  // ========================================================================
  // INSTRUCTIONS SHEET
  // ========================================================================

  const instructions = locale === 'en' 
    ? [
        ['JobE Import Template - Instructions'],
        [''],
        ['OVERVIEW'],
        ['This template helps you bulk import departments and positions into your organization.'],
        ['Fill in the data in the Departments and Positions sheets, then upload this file.'],
        [''],
        ['REQUIRED FIELDS'],
        ['Departments:'],
        ['  • Department Code: Unique identifier (e.g., TECH, HR, FIN)'],
        ['  • Department Name: Display name of the department'],
        [''],
        ['Positions:'],
        ['  • Position Code: Unique identifier (e.g., TECH-001, HR-MGR)'],
        ['  • Position Title: Job title for the position'],
        ['  • Department Code: Must match a department code from Departments sheet'],
        [''],
        ['OPTIONAL FIELDS'],
        ['Departments:'],
        ['  • Description: Additional details about the department'],
        ['  • Parent Department Code: For hierarchical structures'],
        [''],
        ['Positions:'],
        ['  • Description: Job description and responsibilities'],
        ['  • Employment Type: FULL_TIME, PART_TIME, CONTRACT, TEMPORARY, INTERN'],
        ['  • Location: Office, Remote, Hybrid, Field, or specific location'],
        ['  • Salary Min/Max: Salary range for the position'],
        ['  • Currency: USD, EUR, GBP, TRY, etc.'],
        [''],
        ['TIPS'],
        ['1. Use clear, consistent codes (e.g., TECH, TECH-ENG, TECH-ENG-001)'],
        ['2. Create parent departments before child departments'],
        ['3. Ensure all position department codes exist in Departments sheet'],
        ['4. Existing records will be updated, new ones will be created'],
        ['5. Empty rows will be automatically skipped'],
        [''],
        ['SUPPORT'],
        ['For help, contact your administrator or visit the documentation.'],
      ]
    : [
        ['JobE İçe Aktarma Şablonu - Talimatlar'],
        [''],
        ['GENEL BAKIŞ'],
        ['Bu şablon, organizasyonunuza toplu departman ve pozisyon aktarmanıza yardımcı olur.'],
        ['Departments ve Positions sayfalarındaki verileri doldurun, ardından bu dosyayı yükleyin.'],
        [''],
        ['ZORUNLU ALANLAR'],
        ['Departmanlar:'],
        ['  • Departman Kodu: Benzersiz tanımlayıcı (örn. TECH, HR, FIN)'],
        ['  • Departman Adı: Departmanın görünen adı'],
        [''],
        ['Pozisyonlar:'],
        ['  • Pozisyon Kodu: Benzersiz tanımlayıcı (örn. TECH-001, HR-MGR)'],
        ['  • Pozisyon Başlığı: Pozisyon için iş unvanı'],
        ['  • Departman Kodu: Departments sayfasındaki bir departman koduyla eşleşmeli'],
        [''],
        ['OPSİYONEL ALANLAR'],
        ['Departmanlar:'],
        ['  • Açıklama: Departman hakkında ek detaylar'],
        ['  • Üst Departman Kodu: Hiyerarşik yapılar için'],
        [''],
        ['Pozisyonlar:'],
        ['  • Açıklama: İş tanımı ve sorumluluklar'],
        ['  • İstihdam Türü: FULL_TIME, PART_TIME, CONTRACT, TEMPORARY, INTERN'],
        ['  • Lokasyon: Office, Remote, Hybrid, Field veya özel lokasyon'],
        ['  • Maaş Min/Max: Pozisyon için maaş aralığı'],
        ['  • Para Birimi: USD, EUR, GBP, TRY, vb.'],
        [''],
        ['İPUÇLARI'],
        ['1. Açık, tutarlı kodlar kullanın (örn. TECH, TECH-ENG, TECH-ENG-001)'],
        ['2. Üst departmanları alt departmanlardan önce oluşturun'],
        ['3. Tüm pozisyon departman kodlarının Departments sayfasında bulunduğundan emin olun'],
        ['4. Mevcut kayıtlar güncellenecek, yenileri oluşturulacak'],
        ['5. Boş satırlar otomatik olarak atlanacak'],
        [''],
        ['DESTEK'],
        ['Yardım için yöneticinizle iletişime geçin veya dokümantasyonu ziyaret edin.'],
      ]

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions)
  
  // Set column width for instructions
  instructionsSheet['!cols'] = [{ wch: 80 }]

  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')

  // Write to array buffer
  const wbout = XLSX.write(workbook, {
    type: 'array',
    bookType: 'xlsx',
    cellStyles: true,
  })

  return wbout
}

/**
 * Download the template file to user's computer
 */
export function downloadTemplate(options: TemplateOptions = {}): void {
  try {
    const arrayBuffer = generateImportTemplate(options)
    const blob = new Blob([arrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `jobe-import-template-${new Date().toISOString().split('T')[0]}.xlsx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating template:', error)
    throw new Error('Failed to generate template file')
  }
}
