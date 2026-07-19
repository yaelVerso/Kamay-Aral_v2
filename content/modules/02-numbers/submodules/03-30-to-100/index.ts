import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'numbers-30-to-100',
  moduleId: 'numbers',
  title: 'Numbers by Tens (30 to 100)',
  shortTitle: '30-100',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'numbers-30', label: '30', videoPath: videoUrl('/videos/numbers/30.mp4'), acceptedAnswers: ['30', 'thirty'] },
    { id: 'numbers-40', label: '40', videoPath: videoUrl('/videos/numbers/40.mp4'), acceptedAnswers: ['40', 'forty'] },
    { id: 'numbers-50', label: '50', videoPath: videoUrl('/videos/numbers/50.mp4'), acceptedAnswers: ['50', 'fifty'] },
    { id: 'numbers-60', label: '60', videoPath: videoUrl('/videos/numbers/60.mp4'), acceptedAnswers: ['60', 'sixty'] },
    { id: 'numbers-70', label: '70', videoPath: videoUrl('/videos/numbers/70.mp4'), acceptedAnswers: ['70', 'seventy'] },
    { id: 'numbers-80', label: '80', videoPath: videoUrl('/videos/numbers/80.mp4'), acceptedAnswers: ['80', 'eighty'] },
    { id: 'numbers-90', label: '90', videoPath: videoUrl('/videos/numbers/90.mp4'), acceptedAnswers: ['90', 'ninety'] },
    { id: 'numbers-100', label: '100', videoPath: videoUrl('/videos/numbers/100.mp4'), acceptedAnswers: ['100', 'one hundred', 'hundred'] },
  ],
}

export default submodule
