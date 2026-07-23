import type { Module } from '@/content/types'
import days from './submodules/01-days-of-the-week'
import monthsJanJun from './submodules/02-months-jan-to-jun'
import monthsJulDec from './submodules/03-months-jul-to-dec'
import timeWords from './submodules/04-time-words'

const module: Module = {
  id: 'time',
  order: 9,
  title: 'Days, Months, and Time',
  description: 'Learn to sign days of the week, months, and telling time.',
  icon: '📅',
  subModules: [days, monthsJanJun, monthsJulDec, timeWords],
  color: 'bg-[#4D70BE] shadow-[0_4px_0_#0D348D] hover:bg-[#355DB4]'
}

export default module
