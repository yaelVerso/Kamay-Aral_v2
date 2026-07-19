import type { Module } from '@/content/types'
import aToG from './submodules/01-a-to-g'
import hToN from './submodules/02-h-to-n'
import oToU from './submodules/03-o-to-u'
import vToZ from './submodules/04-v-to-z'

/*
Format:
{
  id: 'alphabet',
  order: 1,
  title: 'Alphabet',
  description: 'Learn the Filipino Sign Language alphabet from A to Z.',
  icon: '🔤',
  subModules: [aToG, hToN, oToU, vToZ],
  color: 'bg-[#FFAB41] shadow-[0_4px_0_#F18701] hover:bg-[#FF9F26]',
}

- id: unique, lowercase, used in URLs like /module/alphabet
- order: controls where this module sits in the module list (1, 2, 3, ...)
- title / description: shown on the module card
- icon: a single emoji for the module card
- subModules: import each sub-module file at the top of this file, then list
  them here in the order they should appear — an empty array means the
  module shows up but has no lessons yet
- color: Tailwind classes for the card's background/shadow/hover — pick one
  not already used by another module
*/

const module: Module = {
  id: 'alphabet',
  order: 1,
  title: 'Alphabet',
  description: 'Learn the Filipino Sign Language alphabet from A to Z.',
  icon: '🔤',
  subModules: [aToG, hToN, oToU, vToZ],
  color: 'bg-[#FFAB41] shadow-[0_4px_0_#F18701] hover:bg-[#FF9F26]'
}

export default module
