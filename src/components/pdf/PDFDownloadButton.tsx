import { useState } from 'react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { FileDown, Loader2 } from 'lucide-react'
import { AthleteReportPDF, type AthleteReportData } from '@/components/pdf/AthleteReportPDF'
import { cn } from '@/lib/utils'

interface PDFDownloadButtonProps {
    data: AthleteReportData
    filename?: string
    label?: string
    className?: string
    variant?: 'primary' | 'ghost'
}

export function PDFDownloadButton({
    data,
    filename,
    label = 'Download Report',
    className,
    variant = 'primary',
}: PDFDownloadButtonProps) {
    const [clicked, setClicked] = useState(false)

    const safeFilename = filename ?? `SELF_Report_${data.name.replace(/\s+/g, '_')}.pdf`

    return (
        <PDFDownloadLink
            document={<AthleteReportPDF data={data} />}
            fileName={safeFilename}
        >
            {({ loading }) => (
                <button
                    onClick={() => setClicked(true)}
                    disabled={loading}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-sm transition-all active:scale-95 select-none',
                        variant === 'primary'
                            ? 'bg-[#C8F000] text-[#0D0D0D] hover:bg-[#d4f520] disabled:opacity-60'
                            : 'bg-[#1A1A1A] border border-[#2A2A2A] text-white/70 hover:text-white hover:border-[#C8F000]/30 disabled:opacity-40',
                        className
                    )}
                >
                    {loading && clicked
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <FileDown className="w-4 h-4" />}
                    {loading && clicked ? 'Generating PDF...' : label}
                </button>
            )}
        </PDFDownloadLink>
    )
}
