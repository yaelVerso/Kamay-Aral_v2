import type { Module } from '@/content/types'
import food from './submodules/01-food'
import drinks from './submodules/02-drinks'
import dailyRoutines from './submodules/03-daily-routines'
import moreActions from './submodules/04-more-actions'

const module: Module = {
  id: 'food',
  order: 8,
  title: 'Food, Drink, and Daily Routines',
  description: 'Signs for food, drinks, and everyday routines.',
  icon: '🍚',
  subModules: [food, drinks, dailyRoutines, moreActions],
  color: 'bg-[#E14E4E] shadow-[0_4px_0_#9B0505] hover:bg-[#D33939]'
}

export default module
