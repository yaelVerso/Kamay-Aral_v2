export const STUDENT_ID_LENGTH = 12

export const STUDENT_ID_HINT = `Exactly ${STUDENT_ID_LENGTH} digits, numbers only.`

export const TEACHER_ID_HINT = 'Digits only.'

export function isValidStudentId(idNumber: string): boolean {
  return new RegExp(`^\\d{${STUDENT_ID_LENGTH}}$`).test(idNumber)
}

export function isValidTeacherId(idNumber: string): boolean {
  return /^\d+$/.test(idNumber)
}
