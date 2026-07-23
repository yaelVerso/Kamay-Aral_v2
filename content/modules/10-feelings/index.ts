import type { Module } from '@/content/types'
import feelings from './submodules/01-feelings'
import moreFeelings from './submodules/02-more-feelings'

const module: Module = {
  id: 'feelings',
  order: 10,
  title: 'Feelings and Emotions',
  description: 'Express feelings and emotions in Filipino Sign Language.',
  icon: '😊',
  subModules: [feelings, moreFeelings],
  color: 'bg-[#FCCF52] shadow-[0_4px_0_#C69202] hover:bg-[#F3BD25]'
}

export default module
