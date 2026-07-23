import type { Module } from '@/content/types'
import schoolSupplies from './submodules/01-school-supplies'
import classroomItems from './submodules/02-classroom-items'
import placesInSchool from './submodules/03-places-in-school'
import classroomActions from './submodules/04-classroom-actions'

const module: Module = {
  id: 'school',
  order: 7,
  title: 'School and Classroom',
  description: 'Signs for school subjects, objects, and classroom interactions.',
  icon: '🏫',
  subModules: [schoolSupplies, classroomItems, placesInSchool, classroomActions],
  color: 'bg-[#7A9E49] shadow-[0_4px_0_#48691C] hover:bg-[#668E2D]'
}

export default module
