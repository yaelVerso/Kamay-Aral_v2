import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'numbers-0-to-10',
  moduleId: 'numbers',
  title: 'Numbers 0 to 10',
  shortTitle: '0-10',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'numbers-0', label: '0', videoPath: videoUrl('/videos/numbers/0.mp4'), acceptedAnswers: ['0', 'zero'] },
    { id: 'numbers-1', label: '1', videoPath: videoUrl('/videos/numbers/1.mp4'), acceptedAnswers: ['1', 'one'] },
    { id: 'numbers-2', label: '2', videoPath: videoUrl('/videos/numbers/2.mp4'), acceptedAnswers: ['2', 'two'] },
    { id: 'numbers-3', label: '3', videoPath: videoUrl('/videos/numbers/3.mp4'), acceptedAnswers: ['3', 'three'] },
    { id: 'numbers-4', label: '4', videoPath: videoUrl('/videos/numbers/4.mp4'), acceptedAnswers: ['4', 'four'] },
    { id: 'numbers-5', label: '5', videoPath: videoUrl('/videos/numbers/5.mp4'), acceptedAnswers: ['5', 'five'] },
    { id: 'numbers-6', label: '6', videoPath: videoUrl('/videos/numbers/6.mp4'), acceptedAnswers: ['6', 'six'] },
    { id: 'numbers-7', label: '7', videoPath: videoUrl('/videos/numbers/7.mp4'), acceptedAnswers: ['7', 'seven'] },
    { id: 'numbers-8', label: '8', videoPath: videoUrl('/videos/numbers/8.mp4'), acceptedAnswers: ['8', 'eight'] },
    { id: 'numbers-9', label: '9', videoPath: videoUrl('/videos/numbers/9.mp4'), acceptedAnswers: ['9', 'nine'] },
    { id: 'numbers-10', label: '10', videoPath: videoUrl('/videos/numbers/10.mp4'), acceptedAnswers: ['10', 'ten'] },
  ],
}

export default submodule
