import type { Module } from '@/content/types'
import questionWords from './submodules/01-question-words'
import pronouns from './submodules/02-pronouns'
import demonstratives from './submodules/03-demonstratives'

const module: Module = {
  id: 'questions-pronouns',
  order: 5,
  title: 'Questions and Pronouns',
  description: 'Learn question words and pronouns used in everyday FSL conversations.',
  icon: '❓',
  subModules: [questionWords, pronouns, demonstratives],
  color: 'bg-[#8FA8F0] shadow-[0_4px_0_#3D5FC4] hover:bg-[#6E8BEA]'
}

export default module
