import type { Module } from '@/content/types'
import colors from './submodules/01-colors'
import shapes from './submodules/02-shapes'
import sizes from './submodules/03-sizes'

const module: Module = {
  id: 'colors-shapes',
  order: 6,
  title: 'Colors, Shapes, and Sizes',
  description: 'Learn to sign colors, shapes, and size descriptors.',
  icon: '🎨',
  subModules: [colors, shapes, sizes],
  color: 'bg-[#B76BDC] shadow-[0_4px_0_#8749A6] hover:bg-[#AD56D8]'
}

export default module
