import type { SubModule } from '@/content/types'
import { videoUrl } from '@/lib/media'

const submodule: SubModule = {
  id: 'food-daily-routines',
  moduleId: 'food',
  title: 'Daily Routines',
  shortTitle: 'Routines',
  activitySequence: ['lesson-card', 'sign-to-picture', 'drag-drop-match', 'spelling'],
  items: [
    { id: 'food-eat', label: 'Eat', videoPath: videoUrl('/videos/food/eat.mp4'), acceptedAnswers: ['eat'] },
    { id: 'food-drink', label: 'Drink', videoPath: videoUrl('/videos/food/drink.mp4'), acceptedAnswers: ['drink'] },
    { id: 'food-sleep', label: 'Sleep', videoPath: videoUrl('/videos/food/sleep.mp4'), acceptedAnswers: ['sleep'] },
    { id: 'food-wake-up', label: 'Wake Up', videoPath: videoUrl('/videos/food/wake-up.mp4'), acceptedAnswers: ['wake up', 'wake-up'] },
    { id: 'food-take-a-bath', label: 'Take a Bath', videoPath: videoUrl('/videos/food/take-a-bath.mp4'), acceptedAnswers: ['take a bath'] },
    { id: 'food-cook', label: 'Cook', videoPath: videoUrl('/videos/food/cook.mp4'), acceptedAnswers: ['cook'] },
  ],
}

export default submodule
