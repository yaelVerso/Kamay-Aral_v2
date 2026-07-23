import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'food-more-actions',
  moduleId: 'food',
  title: 'More Actions',
  shortTitle: 'Actions',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'food-buy', label: 'Buy', videoPath: videoUrl('/videos/food/buy.mp4'), acceptedAnswers: ['buy'] },
    { id: 'food-play', label: 'Play', videoPath: videoUrl('/videos/food/play.mp4'), acceptedAnswers: ['play'] },
    { id: 'food-watch', label: 'Watch', videoPath: videoUrl('/videos/food/watch.mp4'), acceptedAnswers: ['watch'] },
    { id: 'food-study', label: 'Study', videoPath: videoUrl('/videos/food/study.mp4'), acceptedAnswers: ['study'] },
    { id: 'food-brush-teeth', label: 'Brush Teeth', videoPath: videoUrl('/videos/food/brush-teeth.mp4'), acceptedAnswers: ['brush teeth'] },
  ],
}

export default submodule
