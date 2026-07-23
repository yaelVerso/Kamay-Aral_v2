import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'food-drinks',
  moduleId: 'food',
  title: 'Drinks',
  shortTitle: 'Drinks',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'food-water', label: 'Water', videoPath: videoUrl('/videos/food/water.mp4'), acceptedAnswers: ['water'] },
    { id: 'food-milk', label: 'Milk', videoPath: videoUrl('/videos/food/milk.mp4'), acceptedAnswers: ['milk'] },
    { id: 'food-juice', label: 'Juice', videoPath: videoUrl('/videos/food/juice.mp4'), acceptedAnswers: ['juice'] },
    { id: 'food-coffee', label: 'Coffee', videoPath: videoUrl('/videos/food/coffee.mp4'), acceptedAnswers: ['coffee'] },
    { id: 'food-tea', label: 'Tea', videoPath: videoUrl('/videos/food/tea.mp4'), acceptedAnswers: ['tea'] },
    { id: 'food-softdrink', label: 'Softdrink', videoPath: videoUrl('/videos/food/softdrink.mp4'), acceptedAnswers: ['softdrink'] },
  ],
}

export default submodule
