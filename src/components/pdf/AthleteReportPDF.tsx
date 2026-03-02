import {
    Document, Page, Text, View, StyleSheet, Image
} from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'

// ── Types ──────────────────────────────────────────────────────────

export interface AthleteReportData {
    name: string
    sport: string | null
    position: string | null
    grade: string | null
    height: string | null
    weight: number | null
    photoUrl: string | null
    gpa: number | null
    hudlUrl: string | null
    recruitingUrl: string | null
    teamName: string | null
    school: string | null
    coachName: string | null
    // Metrics
    fortyYard: number | null
    bench: number | null
    squat: number | null
    vertical: number | null
    // NCAA Eligibility
    division: 'D1' | 'D2' | 'D3' | 'NAIA'
    coreGPA: number | null
    coreCourseCount: number
    coreCourseRequired: number
    eligible: boolean
    // Grades
    grades: { subject: string; quarter: string; letter: string; gpa: number }[]
}

// ── Styles ─────────────────────────────────────────────────────────

const C = {
    black: '#0D0D0D',
    volt: '#C8F000',
    gray1: '#1A1A1A',
    gray2: '#2A2A2A',
    gray3: '#888888',
    white: '#FFFFFF',
    red: '#FF4444',
    orange: '#F4A261',
}

const S = StyleSheet.create({
    page: { backgroundColor: C.black, padding: 32, fontFamily: 'Helvetica', color: C.white, fontSize: 9 },
    // ── Header
    header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20, gap: 16 },
    photo: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.gray1 },
    headerText: { flex: 1 },
    name: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.white, marginBottom: 4 },
    tagline: { fontSize: 8, color: C.volt, letterSpacing: 2, marginBottom: 8 },
    pill: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
    pillItem: { backgroundColor: C.gray2, color: C.gray3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, fontSize: 7 },
    pillVolt: { backgroundColor: '#C8F00020', color: C.volt, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, fontSize: 7 },
    // ── Divider
    divider: { height: 1, backgroundColor: C.gray2, marginVertical: 12 },
    voltDivider: { height: 2, backgroundColor: C.volt, marginVertical: 12 },
    // ── Section
    sectionTitle: { fontSize: 7, color: C.volt, letterSpacing: 2, fontFamily: 'Helvetica-Bold', marginBottom: 8, textTransform: 'uppercase' },
    // ── Metrics grid
    metricsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    metricBox: { flex: 1, backgroundColor: C.gray1, borderRadius: 8, padding: 10, alignItems: 'center' },
    metricValue: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.volt, marginBottom: 2 },
    metricLabel: { fontSize: 7, color: C.gray3 },
    // ── Two-column
    twoCol: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    col: { flex: 1 },
    // ── Info rows
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.gray2 },
    infoLabel: { color: C.gray3, fontSize: 8 },
    infoValue: { color: C.white, fontSize: 8, fontFamily: 'Helvetica-Bold' },
    // ── Grade table
    tableHeader: { flexDirection: 'row', backgroundColor: C.gray2, padding: 6, borderRadius: 4, marginBottom: 2 },
    tableRow: { flexDirection: 'row', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: C.gray2 },
    tableCell: { fontSize: 8, color: C.white },
    tableHeaderCell: { fontSize: 7, color: C.gray3, fontFamily: 'Helvetica-Bold' },
    // ── Status badge
    badgeGreen: { backgroundColor: '#C8F00020', color: C.volt, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, fontSize: 7 },
    badgeRed: { backgroundColor: '#FF444420', color: C.red, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, fontSize: 7 },
    badgeOrange: { backgroundColor: '#F4A26120', color: C.orange, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10, fontSize: 7 },
    // ── Footer
    footer: { position: 'absolute', bottom: 20, left: 32, right: 32, flexDirection: 'row', justifyContent: 'space-between' },
    footerText: { fontSize: 7, color: C.gray3 },
    footerBrand: { fontSize: 7, color: C.volt, fontFamily: 'Helvetica-Bold' },
    // ── Disclaimer
    disclaimer: { fontSize: 6, color: C.gray3, marginTop: 8, lineHeight: 1.5 },
})

// ── Helper components ──────────────────────────────────────────────

function SectionTitle({ children }: { children: string }) {
    return <Text style={S.sectionTitle}>{children}</Text>
}

function Divider({ volt = false }: { volt?: boolean }) {
    return <View style={volt ? S.voltDivider : S.divider} />
}

function InfoRow({ label, value, style }: { label: string; value: string; style?: Style }) {
    return (
        <View style={S.infoRow}>
            <Text style={S.infoLabel}>{label}</Text>
            <Text style={[S.infoValue, style ?? {}]}>{value}</Text>
        </View>
    )
}

function MetricBox({ value, label }: { value: string; label: string }) {
    return (
        <View style={S.metricBox}>
            <Text style={S.metricValue}>{value}</Text>
            <Text style={S.metricLabel}>{label}</Text>
        </View>
    )
}

// ── Main Document ──────────────────────────────────────────────────

export function AthleteReportPDF({ data }: { data: AthleteReportData }) {
    const gpaColor: Style = data.gpa !== null && data.gpa < 2.5 ? { color: C.red } : { color: C.volt }
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

    return (
        <Document title={`SELF Report — ${data.name}`} author="SELF Platform">
            {/* ── PAGE 1: Recruiting Profile ── */}
            <Page size="LETTER" style={S.page}>

                {/* Header */}
                <View style={S.header}>
                    {data.photoUrl && <Image style={S.photo} src={data.photoUrl} />}
                    <View style={S.headerText}>
                        <Text style={S.tagline}>SELF ATHLETE REPORT</Text>
                        <Text style={S.name}>{data.name}</Text>
                        <View style={S.pill}>
                            {data.sport && <Text style={S.pillItem}>{data.sport}</Text>}
                            {data.position && <Text style={S.pillItem}>{data.position}</Text>}
                            {data.grade && <Text style={S.pillItem}>{data.grade}</Text>}
                            {data.school && <Text style={S.pillVolt}>{data.school}</Text>}
                        </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.volt }}>SELF</Text>
                        <Text style={{ fontSize: 6, color: C.gray3 }}>Know your SELF.</Text>
                    </View>
                </View>

                <Divider volt />

                {/* Physical & Contact */}
                <View style={S.twoCol}>
                    <View style={S.col}>
                        <SectionTitle>Physical</SectionTitle>
                        <InfoRow label="Height" value={data.height ?? '—'} />
                        <InfoRow label="Weight" value={data.weight ? `${data.weight} lbs` : '—'} />
                        <InfoRow label="Position" value={data.position ?? '—'} />
                        <InfoRow label="Sport" value={data.sport ?? '—'} />
                    </View>
                    <View style={S.col}>
                        <SectionTitle>Academic</SectionTitle>
                        <InfoRow label="GPA" value={data.gpa !== null ? data.gpa.toFixed(2) : '—'} style={gpaColor} />
                        <InfoRow label="Division Target" value={data.division} />
                        <InfoRow label="Core Courses" value={`${data.coreCourseCount} / ${data.coreCourseRequired}`} />
                        <InfoRow label="Eligible" value={data.eligible ? '✓ Yes' : '✗ No'} style={data.eligible ? { color: C.volt } : { color: C.red }} />
                    </View>
                </View>

                <Divider />

                {/* Performance Metrics */}
                <SectionTitle>Performance Metrics</SectionTitle>
                <View style={S.metricsRow}>
                    {data.fortyYard && <MetricBox value={`${data.fortyYard}s`} label="40-Yard Dash" />}
                    {data.bench && <MetricBox value={`${data.bench} lbs`} label="Bench Press 1RM" />}
                    {data.squat && <MetricBox value={`${data.squat} lbs`} label="Squat 1RM" />}
                    {data.vertical && <MetricBox value={`${data.vertical}"`} label="Vertical Jump" />}
                    {!data.fortyYard && !data.bench && !data.squat && !data.vertical && (
                        <Text style={{ color: C.gray3, fontSize: 8 }}>No metrics recorded. Log workouts to populate performance data.</Text>
                    )}
                </View>

                {/* Recruiting Links */}
                {(data.hudlUrl || data.recruitingUrl) && (
                    <>
                        <Divider />
                        <SectionTitle>Film & Profiles</SectionTitle>
                        {data.hudlUrl && (
                            <View style={S.infoRow}><Text style={S.infoLabel}>HUDL</Text><Text style={[S.infoValue, { color: C.volt }]}>{data.hudlUrl}</Text></View>
                        )}
                        {data.recruitingUrl && (
                            <View style={S.infoRow}><Text style={S.infoLabel}>Recruiting Profile</Text><Text style={[S.infoValue, { color: C.volt }]}>{data.recruitingUrl}</Text></View>
                        )}
                    </>
                )}

                <Divider />

                {/* Grade Table */}
                <SectionTitle>Academic Record</SectionTitle>
                <View style={S.tableHeader}>
                    {['Subject', 'Quarter', 'Grade', 'GPA Pts'].map(h => (
                        <Text key={h} style={[S.tableHeaderCell, { flex: h === 'Subject' ? 3 : 1 }]}>{h}</Text>
                    ))}
                </View>
                {data.grades.slice(0, 12).map((g, i) => (
                    <View key={i} style={S.tableRow}>
                        <Text style={[S.tableCell, { flex: 3 }]}>{g.subject}</Text>
                        <Text style={[S.tableCell, { flex: 1 }]}>{g.quarter}</Text>
                        <Text style={[S.tableCell, { flex: 1, color: g.gpa < 1 ? C.red : g.gpa < 2 ? C.orange : C.volt }]}>{g.letter}</Text>
                        <Text style={[S.tableCell, { flex: 1 }]}>{g.gpa.toFixed(1)}</Text>
                    </View>
                ))}
                {data.grades.length === 0 && <Text style={{ color: C.gray3, fontSize: 8 }}>No grades recorded.</Text>}

                {/* Footer */}
                <View style={S.footer}>
                    <Text style={S.footerText}>Generated {today} · Confidential</Text>
                    <Text style={S.footerBrand}>SELF Platform — Know your SELF.</Text>
                </View>
            </Page>

            {/* ── PAGE 2: NCAA Eligibility ── */}
            <Page size="LETTER" style={S.page}>
                <Text style={S.tagline}>NCAA ELIGIBILITY REPORT</Text>
                <Text style={[S.name, { marginBottom: 4 }]}>{data.name}</Text>
                <Text style={{ color: C.gray3, fontSize: 8, marginBottom: 12 }}>Division {data.division} Eligibility Assessment · {today}</Text>

                <Divider volt />

                {/* Eligibility status hero */}
                <View style={{ backgroundColor: data.eligible ? '#C8F00015' : '#FF444415', borderRadius: 10, padding: 16, marginBottom: 16, alignItems: 'center' }}>
                    <Text style={{ fontSize: 28, fontFamily: 'Helvetica-Bold', color: data.eligible ? C.volt : C.red, marginBottom: 4 }}>
                        {data.eligible ? '✓ ELIGIBLE' : '✗ NOT ELIGIBLE'}
                    </Text>
                    <Text style={{ fontSize: 8, color: C.gray3 }}>
                        {data.eligible
                            ? `${data.name} meets Division ${data.division} eligibility requirements as of this report.`
                            : `${data.name} does not currently meet all Division ${data.division} requirements.`}
                    </Text>
                </View>

                {/* Key numbers */}
                <View style={S.twoCol}>
                    <View style={S.col}>
                        <SectionTitle>Academic Standing</SectionTitle>
                        <InfoRow label="Core GPA" value={data.coreGPA !== null ? data.coreGPA.toFixed(2) : '—'} style={data.coreGPA !== null && data.coreGPA >= 2.3 ? { color: C.volt } : { color: C.red }} />
                        <InfoRow label="Division Target" value={`Division ${data.division}`} />
                        <InfoRow label="Required GPA" value={data.division === 'D1' ? '2.30' : data.division === 'D2' ? '2.20' : 'N/A'} />
                    </View>
                    <View style={S.col}>
                        <SectionTitle>Core Courses</SectionTitle>
                        <InfoRow label="Completed" value={`${data.coreCourseCount}`} />
                        <InfoRow label="Required" value={`${data.coreCourseRequired}`} />
                        <InfoRow label="Remaining" value={`${Math.max(0, data.coreCourseRequired - data.coreCourseCount)}`}
                            style={data.coreCourseCount >= data.coreCourseRequired ? { color: C.volt } : { color: C.orange }} />
                    </View>
                </View>

                <Divider />

                {/* Division requirements summary */}
                <SectionTitle>{`Division ${data.division} Requirements Overview`}</SectionTitle>
                {[
                    { label: 'Minimum Core GPA', req: data.division === 'D1' ? '2.30' : data.division === 'D2' ? '2.20' : 'N/A', met: data.coreGPA === null || data.coreGPA >= (data.division === 'D1' ? 2.3 : 2.2) },
                    { label: 'Core Courses Completed', req: `${data.coreCourseRequired} courses`, met: data.coreCourseCount >= data.coreCourseRequired },
                    { label: 'High School Graduation', req: 'Required', met: true },
                    { label: 'Amateurism', req: 'No pro contracts', met: true },
                ].map(({ label, req, met }) => (
                    <View key={label} style={S.infoRow}>
                        <Text style={S.infoLabel}>{label}</Text>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                            <Text style={{ fontSize: 8, color: C.gray3 }}>{req}</Text>
                            <Text style={met ? S.badgeGreen : S.badgeRed}>{met ? '✓ Met' : '✗ Not Met'}</Text>
                        </View>
                    </View>
                ))}

                <Divider />

                <Text style={S.disclaimer}>
                    DISCLAIMER: This report is generated from data entered into the SELF platform and is for informational purposes only.
                    NCAA eligibility is ultimately determined by the NCAA Eligibility Center (ncaaeligibilitycenter.org). This report does not
                    constitute official certification of eligibility. Coaches and athletes should consult the official NCAA Guide for the
                    College-Bound Student-Athlete and contact their state association for the most current requirements.
                </Text>

                {/* Footer */}
                <View style={S.footer}>
                    <Text style={S.footerText}>Generated {today} · For informational use only</Text>
                    <Text style={S.footerBrand}>SELF Platform — Know your SELF.</Text>
                </View>
            </Page>
        </Document>
    )
}
