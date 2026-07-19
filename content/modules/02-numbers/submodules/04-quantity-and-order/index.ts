import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'numbers-quantity-and-order',
  moduleId: 'numbers',
  title: 'Counting and Order Words',
  shortTitle: 'Counting & Order',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'numbers-many', label: 'Many', videoPath: videoUrl('/videos/numbers/many.mp4'), acceptedAnswers: ['many'] },
    { id: 'numbers-few', label: 'Few', videoPath: videoUrl('/videos/numbers/few.mp4'), acceptedAnswers: ['few'] },
    { id: 'numbers-none', label: 'None', videoPath: videoUrl('/videos/numbers/none.mp4'), acceptedAnswers: ['none'] },
    { id: 'numbers-all', label: 'All', videoPath: videoUrl('/videos/numbers/all.mp4'), acceptedAnswers: ['all'] },
    { id: 'numbers-first', label: 'First', videoPath: videoUrl('/videos/numbers/first.mp4'), acceptedAnswers: ['first', '1st'] },
    { id: 'numbers-second', label: 'Second', videoPath: videoUrl('/videos/numbers/second.mp4'), acceptedAnswers: ['second', '2nd'] },
    { id: 'numbers-third', label: 'Third', videoPath: videoUrl('/videos/numbers/third.mp4'), acceptedAnswers: ['third', '3rd'] },
    { id: 'numbers-last', label: 'Last', videoPath: videoUrl('/videos/numbers/last.mp4'), acceptedAnswers: ['last'] },
  ],
}

export default submodule
