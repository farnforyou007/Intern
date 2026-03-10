// src/app/api/admin/students/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { apiSuccess, apiError } from '@/lib/api-helpers'

/**
 * GET /api/admin/students?year=2568
 * ดึงข้อมูลนักศึกษา, sites, mentors, availableYears
 */
export async function GET(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.app_metadata.provider !== 'email') {
            return apiError('Unauthorized', 401)
        }

        const { searchParams } = new URL(req.url)
        const selectedYear = searchParams.get('year') || ''
        const search = searchParams.get('search') || ''
        const batch = searchParams.get('batch') || ''
        const rotationId = searchParams.get('rotationId') || ''
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10') // Default to 10

        const from = (page - 1) * limit
        const to = from + limit - 1

        // ดึง available years
        const { data: yearsData } = await supabase.from('students').select('training_year')
        const currentYearBS = (new Date().getFullYear() + 543).toString()
        let availableYears: string[] = []
        if (yearsData) {
            const years = Array.from(new Set(yearsData.map(s => s.training_year).filter(Boolean))) as string[]
            availableYears = years.length === 0 ? [currentYearBS] : years.sort((a, b) => b.localeCompare(a))
        }

        // --- STEP 1: หารายชื่อนักศึกษาที่เรียงตามโรงพยาบาล ---
        // เราต้องดึง Student IDs ทั้งหมดที่ผ่าน Filter แล้วเรียงตาม Site Name
        let baseFilterQuery = supabase
            .from('student_assignments')
            .select(`
                student_id,
                training_sites!inner(site_name),
                students!inner(student_code, first_name, last_name, training_year)
            `, { count: 'exact' })

        if (selectedYear) baseFilterQuery = baseFilterQuery.eq('students.training_year', selectedYear)
        if (rotationId) baseFilterQuery = baseFilterQuery.eq('rotation_id', rotationId)
        if (batch) baseFilterQuery = baseFilterQuery.like('students.student_code', `${batch}%`)

        if (search) {
            // ค้นหาโรงพยาบาล
            const { data: matchedSites } = await supabase.from('training_sites').select('id').ilike('site_name', `%${search}%`)
            const siteIds = matchedSites?.map(s => s.id) || []

            const searchConditions = [
                `students.student_code.ilike.%${search}%`,
                `students.first_name.ilike.%${search}%`,
                `students.last_name.ilike.%${search}%`
            ]
            if (siteIds.length > 0) searchConditions.push(`site_id.in.(${siteIds.join(',')})`)

            baseFilterQuery = baseFilterQuery.or(searchConditions.join(','))
        }

        // ดึง IDs ทั้งหมดเพื่อทำ Pagination และ Sorting ที่แม่นยำ
        // เรียงตามชื่อ รพ. (Site Name) และตามด้วยรหัสนักศึกษา
        const { data: allMemberIds, count } = await baseFilterQuery
            .order('site_name', { foreignTable: 'training_sites', ascending: true })
            .order('student_code', { foreignTable: 'students', ascending: true })

        if (!allMemberIds || allMemberIds.length === 0) {
            // Master data for empty response
            const [sitesRes, mentorsRes, rotRes] = await Promise.all([
                supabase.from('training_sites').select('id, site_name, province').order('site_name'),
                supabase.from('supervisors').select('id, full_name, site_id, supervisor_subjects(subject_id, sub_subject_id)').order('full_name'),
                supabase.from('rotations').select('id, name, track, round_number').eq('academic_year', selectedYear || currentYearBS).order('track', { ascending: true }).order('round_number', { ascending: true })
            ])
            return apiSuccess({ students: [], totalCount: 0, sites: sitesRes.data || [], mentors: mentorsRes.data || [], availableYears, availableRotations: rotRes.data || [] })
        }

        // --- FIXED: Count unique student IDs instead of rows ---
        const uniqueStudentIds = [...new Set(allMemberIds.map(m => m.student_id))]
        const totalCount = uniqueStudentIds.length

        // ทำ Pagination บน Memory (หรือจะใช้ IDs ชุดนี้ไป Query ต่อ)
        const pagedIds = uniqueStudentIds.slice(from, to + 1)

        // --- STEP 2: ดึงข้อมูลเต็มของนักศึกษาตามรายชื่อ ID ที่ผ่านการกรองและเรียงลำดับมาแล้ว ---
        const { data: students, error: stError } = await supabase.from('students').select(`
            id, student_code, prefix, first_name, last_name, nickname, phone, email, avatar_url, training_year,
            has_motorcycle, parental_consent_url,
            student_assignments (
                id, rotation_id, site_id, subject_id, sub_subject_id,
                training_sites (site_name, province),
                rotations (id, name, start_date, end_date),
                subjects:subject_id (name),
                sub_subjects:sub_subject_id (name),
                assignment_supervisors (
                    supervisor_id,
                    supervisors (full_name)
                )
            )
        `).in('id', pagedIds)
            .order('rotation_id', { foreignTable: 'student_assignments', ascending: true })

        if (stError) throw stError

        // ต้อง Re-sort ตัวแปร students ให้เรียงตามลำดับ pagedIds ที่เราเตรียมไว้ (เพื่อรักษาลำดับ รพ.)
        const sortedStudents = pagedIds.map(id => students.find(s => s.id === id)).filter(Boolean)

        // ดึง master data
        const [sitesRes, mentorsRes, rotRes] = await Promise.all([
            supabase.from('training_sites').select('id, site_name, province').order('site_name'),
            supabase.from('supervisors').select('id, full_name, site_id, supervisor_subjects(subject_id, sub_subject_id)').order('full_name'),
            supabase.from('rotations').select('id, name, track, round_number').eq('academic_year', selectedYear || currentYearBS).order('track', { ascending: true }).order('round_number', { ascending: true })

        ])


        return apiSuccess({
            students: sortedStudents || [],
            totalCount: totalCount,
            sites: sitesRes.data || [],
            mentors: mentorsRes.data || [],
            availableYears,
            availableRotations: rotRes.data || []
        })


    } catch (error: any) {
        console.error('Admin Students GET Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}


/**
 * POST /api/admin/students
 * Actions: delete, update, add, init-form
 */
export async function POST(req: Request) {
    const supabase = await createServerSupabase()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || user.app_metadata.provider !== 'email') {
            return apiError('Unauthorized', 401)
        }

        const contentType = req.headers.get('content-type') || ''

        // Handle multipart form data (for file upload in 'add' action)
        if (contentType.includes('multipart/form-data')) {
            const formData = await req.formData()
            const action = formData.get('action') as string

            if (action === 'add') {
                const studentDataStr = formData.get('studentData') as string
                const file = formData.get('avatar') as File | null
                const studentData = JSON.parse(studentDataStr)
                const assignments = JSON.parse(formData.get('assignments') as string || '[]')
                const mentorsData = JSON.parse(formData.get('mentorsData') as string || '[]')
                const pdfFile = formData.get('consent_pdf') as File | null

                // 1. ตรวจสอบรหัสซ้ำ
                const { data: check } = await supabase
                    .from('students')
                    .select('id')
                    .eq('student_code', studentData.student_code)
                    .maybeSingle()

                if (check) {
                    return apiError('รหัสนี้ลงทะเบียนแล้ว', 409)
                }

                // 2. Upload avatar
                let publicUrl = ''
                if (file) {
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${studentData.student_code}_${Date.now()}.${fileExt}`

                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(fileName, file)

                    if (uploadError) throw uploadError

                    const { data: urlData } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(fileName)

                    publicUrl = urlData.publicUrl
                }

                // 2.5 Upload parental consent PDF
                let parentalConsentUrl = null
                if (pdfFile) {
                    const pdfExt = pdfFile.name.split('.').pop()
                    const pdfName = `${studentData.student_code}_consent_${Date.now()}.${pdfExt}`

                    const { error: pdfError } = await supabase.storage
                        .from('parental_consents')
                        .upload(pdfName, pdfFile)

                    if (pdfError) throw pdfError

                    const { data: pdfUrlData } = supabase.storage
                        .from('parental_consents')
                        .getPublicUrl(pdfName)

                    parentalConsentUrl = pdfUrlData.publicUrl
                }

                // 3. Insert student
                const { data: student, error: stError } = await supabase
                    .from('students')
                    .insert([{
                        ...studentData,
                        avatar_url: publicUrl,
                        has_motorcycle: formData.get('has_motorcycle') === 'true',
                        parental_consent_url: parentalConsentUrl || null
                    }])
                    .select()
                    .single()

                if (stError) throw stError

                // 4. Create assignments (Granular)
                if (assignments.length > 0) {
                    for (const as of assignments) {
                        if (as.site_id && as.subjects && as.subjects.length > 0) {
                            for (const sub of as.subjects) {
                                // Insert student_assignment
                                const { data: saData, error: saError } = await supabase
                                    .from('student_assignments')
                                    .insert([{
                                        student_id: student.id,
                                        rotation_id: parseInt(as.rotation_id),
                                        site_id: parseInt(as.site_id),
                                        subject_id: sub.subject_id,
                                        sub_subject_id: sub.sub_subject_id || null
                                    }])
                                    .select()
                                    .single()

                                if (saError) throw saError

                                // Save mentors for this specific assignment
                                if (sub.supervisor_ids && sub.supervisor_ids.length > 0) {
                                    const mentorRecords = sub.supervisor_ids.map((sId: any) => ({
                                        assignment_id: saData.id,
                                        supervisor_id: sId
                                    }))
                                    const { error: svError } = await supabase
                                        .from('assignment_supervisors')
                                        .insert(mentorRecords)

                                    if (svError) throw svError
                                }
                            }
                        }
                    }
                }

                return apiSuccess({ student })
            }
        }

        // Handle JSON body (for other actions)
        const body = await req.json()
        const { action } = body

        if (action === 'delete') {
            const { id } = body
            const { error } = await supabase.from('students').delete().eq('id', id)
            if (error) throw error
            return apiSuccess({ deleted: true })
        }

        if (action === 'update') {
            const { studentId, payload, grouped_assignments } = body

            // Update student basic info
            const { error: studentError } = await supabase
                .from('students')
                .update(payload)
                .eq('id', studentId)

            if (studentError) throw studentError

            // Update assignments + supervisors (OPTIMIZED: batch operations)
            if (grouped_assignments && grouped_assignments.length > 0) {
                // Phase 1: แยก entries เก่า vs ใหม่ + เตรียมข้อมูล
                const existingEntries: { id: number; siteId: number; supervisorIds: number[] }[] = []
                const newEntries: { rotationId: number; siteId: number; subjectId: number; subSubjectId: number | null; supervisorIds: number[] }[] = []

                for (const rot of grouped_assignments) {
                    for (const sub of rot.subjects_in_rotation) {
                        if (sub.assignment_id) {
                            existingEntries.push({
                                id: sub.assignment_id,
                                siteId: parseInt(rot.site_id),
                                supervisorIds: sub.supervisor_ids || []
                            })
                        } else {
                            newEntries.push({
                                rotationId: parseInt(rot.rotation_id),
                                siteId: parseInt(rot.site_id),
                                subjectId: sub.subject_id,
                                subSubjectId: sub.sub_subject_id || null,
                                supervisorIds: sub.supervisor_ids || []
                            })
                        }
                    }
                }

                // Phase 2: ทำงานพร้อมกัน — update เก่า + insert ใหม่
                const allAssignmentIds = existingEntries.map(e => e.id)

                const [, newAssignments] = await Promise.all([
                    // Batch update site_id ของ entries เดิม (กลุ่มตาม site_id เพื่อ batch)
                    (async () => {
                        const bySite = existingEntries.reduce((acc, e) => {
                            acc[e.siteId] = acc[e.siteId] || []
                            acc[e.siteId].push(e.id)
                            return acc
                        }, {} as Record<number, number[]>)
                        await Promise.all(
                            Object.entries(bySite).map(([siteId, ids]) =>
                                supabase.from('student_assignments')
                                    .update({ site_id: parseInt(siteId) })
                                    .in('id', ids)
                            )
                        )
                    })(),
                    // Batch insert entries ใหม่
                    newEntries.length > 0
                        ? supabase.from('student_assignments')
                            .insert(newEntries.map(e => ({
                                student_id: studentId,
                                rotation_id: e.rotationId,
                                site_id: e.siteId,
                                subject_id: e.subjectId,
                                sub_subject_id: e.subSubjectId
                            })))
                            .select('id')
                            .then(res => {
                                if (res.error) throw res.error
                                return res.data || []
                            })
                        : Promise.resolve([]),
                    // Bulk delete supervisors เก่าทั้งหมดในคำสั่งเดียว
                    allAssignmentIds.length > 0
                        ? supabase.from('assignment_supervisors').delete().in('assignment_id', allAssignmentIds)
                        : Promise.resolve(null)
                ])

                // Phase 3: รวม supervisor records ใหม่ทั้งหมดแล้ว insert ครั้งเดียว
                const allMentorRecords: { assignment_id: number; supervisor_id: number }[] = []

                // Mentors ของ entries เดิม
                for (const e of existingEntries) {
                    for (const sId of e.supervisorIds) {
                        allMentorRecords.push({ assignment_id: e.id, supervisor_id: sId })
                    }
                }

                // Mentors ของ entries ใหม่
                if (newAssignments && newAssignments.length > 0) {
                    newEntries.forEach((e, i) => {
                        const newId = newAssignments[i]?.id
                        if (newId) {
                            for (const sId of e.supervisorIds) {
                                allMentorRecords.push({ assignment_id: newId, supervisor_id: sId })
                            }
                        }
                    })
                }

                // Bulk insert supervisor records ทั้งหมดในครั้งเดียว
                if (allMentorRecords.length > 0) {
                    const { error: svError } = await supabase.from('assignment_supervisors').insert(allMentorRecords)
                    if (svError) throw svError
                }
            }

            return apiSuccess({ updated: true })
        }

        if (action === 'init-form') {
            const { track } = body || {}
            // ดึง system config + rotations for add modal
            const { data: config } = await supabase
                .from('system_configs')
                .select('key_value')
                .eq('key_name', 'current_training_year')
                .single()

            const currentYear = config?.key_value || new Date().getFullYear() + 543

            let rotQuery = supabase
                .from('rotations')
                .select(`
                    *,
                    rotation_subjects(
                        subject_id,
                        subjects(
                            name,
                            sub_subjects(id, name)
                        )
                    )
                `)
                .eq('academic_year', currentYear)
                .order('round_number', { ascending: true })

            // กรอง track ถ้ามี
            if (track) {
                rotQuery = rotQuery.eq('track', track)
            }

            const { data: rotationsData } = await rotQuery

            // ดึงรายการสายที่มีในระบบ
            const { data: tracksData } = await supabase
                .from('rotations')
                .select('track')
                .eq('academic_year', currentYear)

            const tracks = Array.from(new Set(tracksData?.map(t => t.track))).filter(Boolean).sort()

            return apiSuccess({
                currentYear: currentYear.toString(),
                rotations: rotationsData || [],
                tracks: tracks.length > 0 ? tracks : ['A', 'B', 'C']
            })

        }

        return apiError('Unknown action', 400)
    } catch (error: any) {
        console.error('Admin Students POST Error:', error)
        return apiError(error.message || 'Internal Server Error', 500)
    }
}

// Helper: Save mentors for a specific assignment
async function saveMentorsForAssignment(
    supabase: any,
    assignmentId: number,
    mainSubjectId: number,
    subSubjectId: number | null,
    supervisorIds: number[],
    siteId: string,
    mentorsData: any[]
) {
    const validMentorRecords = mentorsData.filter((m: any) => {
        const isSelected = supervisorIds.includes(m.id)
        const isSameSite = String(m.site_id) === String(siteId)
        if (!isSelected || !isSameSite) return false

        return m.supervisor_subjects?.some((ss: any) => {
            const matchMain = Number(ss.subject_id) === Number(mainSubjectId)
            if (subSubjectId !== null) {
                return matchMain && Number(ss.sub_subject_id) === Number(subSubjectId)
            }
            return matchMain
        })
    }).map((m: any) => ({
        assignment_id: assignmentId,
        supervisor_id: m.id
    }))

    if (validMentorRecords.length > 0) {
        await supabase.from('assignment_supervisors').insert(validMentorRecords)
    }
}
