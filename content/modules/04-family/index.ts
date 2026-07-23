import type { Module } from '@/content/types'
import myself from './submodules/01-myself'
import family from './submodules/02-family'
import extendedFamily from './submodules/03-extended-family'
import people from './submodules/04-people'

const module: Module = {
  id: 'family',
  order: 4,
  title: 'Self, Family, and People',
  description: 'Introduce yourself and learn signs for family members and people around you.',
  icon: '👨‍👩‍👧',
  subModules: [myself, family, extendedFamily, people],
  color: 'bg-[#FF7598] shadow-[0_4px_0_#D11141] hover:bg-[#FC557F]'
}

export default module
